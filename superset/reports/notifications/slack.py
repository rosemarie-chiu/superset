# -*- coding: utf-8 -*-
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
import json
import logging
from io import IOBase
from typing import Optional, Union

from flask_babel import gettext as __
from retry.api import retry
from slack import WebClient
from slack.errors import SlackApiError, SlackClientError

from superset import app
from superset.models.reports import ReportEmailFormat, ReportRecipientType
from superset.reports.notifications.base import BaseNotification
from superset.reports.notifications.exceptions import NotificationError

logger = logging.getLogger(__name__)


class SlackNotification(BaseNotification):  # pylint: disable=too-few-public-methods
    """
    Sends a slack notification for a report recipient
    """

    type = ReportRecipientType.SLACK

    def _get_channel(self) -> str:
        return json.loads(self._recipient.recipient_config_json)["target"]

    def _get_format(self) -> ReportEmailFormat:
        return json.loads(self._recipient.recipient_config_json)["report_format"]

    @staticmethod
    def _error_template(name: str, text: str) -> str:
        return __(
            """
            *%(name)s*\n
            Error: %(text)s
            """,
            name=name,
            text=text,
        )

    def _get_body(self) -> str:
        if self._content.text:
            return self._error_template(self._content.name, self._content.text)

        if (
            self._content.screenshot
            and self._get_format() == ReportEmailFormat.VISUALIZATION
        ):
            url = self._content.screenshot.url
        elif self._content.data and self._get_format() == ReportEmailFormat.DATA:
            url = self._content.data.url
        if (self._content.data or self._content.screenshot) and url:
            return __(
                """
                *%(name)s*\n
                <%(url)s|Explore in Superset>
                """,
                name=self._content.name,
                url=url,
            )
        return self._error_template(self._content.name, "Unexpected missing screenshot")

    def _get_inline_file(self) -> Optional[Union[str, IOBase, bytes]]:
        if (
            self._content.screenshot
            and self._get_format() == ReportEmailFormat.VISUALIZATION
        ):
            return self._content.screenshot.image
        if self._content.data and self._get_format() == ReportEmailFormat.DATA:
            return self._content.data.file
        return None

    @retry(SlackApiError, delay=10, backoff=2, tries=5)
    def send(self) -> None:
        file = self._get_inline_file()
        title = self._content.name
        channel = self._get_channel()
        body = self._get_body()
        file_type = self._get_format().lower()
        try:
            token = app.config["SLACK_API_TOKEN"]
            if callable(token):
                token = token()
            client = WebClient(token=token, proxy=app.config["SLACK_PROXY"])
            # files_upload returns SlackResponse as we run it in sync mode.
            if file:
                client.files_upload(
                    channels=channel,
                    file=file,
                    initial_comment=body,
                    title=title,
                    filetype=file_type,
                )
            else:
                client.chat_postMessage(channel=channel, text=body)
            logger.info("Report sent to slack")
        except SlackClientError as ex:
            raise NotificationError(ex)
