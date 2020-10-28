/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import React from 'react';
import { t } from '@superset-ui/core';
import {
  handleDashboardDelete,
  handleBulkDashboardExport,
} from 'src/views/CRUD/utils';
import { Dropdown, Menu } from 'src/common/components';
import ConfirmStatusChange from 'src/components/ConfirmStatusChange';
import ListViewCard from 'src/components/ListViewCard';
import Icon from 'src/components/Icon';
import Label from 'src/components/Label';
import FacePile from 'src/components/FacePile';
import FaveStar from 'src/components/FaveStar';
import { DashboardCardProps } from 'src/views/CRUD/types';

import { useFavoriteStatus } from 'src/views/CRUD/hooks';

const FAVESTAR_BASE_URL = '/superset/favstar/Dashboard';

function DashboardCard({
  isChart,
  dashboard,
  hasPerm,
  bulkSelectEnabled,
  refreshData,
  addDangerToast,
  addSuccessToast,
  openDashboardEditModal,
}: DashboardCardProps) {
  const canEdit = hasPerm('can_edit');
  const canDelete = hasPerm('can_delete');
  const canExport = hasPerm('can_mulexport');
  const [, fetchFaveStar, saveFaveStar, favoriteStatus] = useFavoriteStatus(
    {},
    FAVESTAR_BASE_URL,
    addDangerToast,
  );

  const cardTitle = isChart ? dashboard.slice_name : dashboard.dashboard_title;

  const menu = (
    <Menu>
      {canDelete && (
        <Menu.Item>
          <ConfirmStatusChange
            title={t('Please Confirm')}
            description={
              <>
                {t('Are you sure you want to delete')} <b>{cardTitle}</b>?
              </>
            }
            onConfirm={() =>
              handleDashboardDelete(
                dashboard,
                refreshData,
                addSuccessToast,
                addDangerToast,
              )
            }
          >
            {confirmDelete => (
              <div
                role="button"
                tabIndex={0}
                className="action-button"
                onClick={confirmDelete}
              >
                <ListViewCard.MenuIcon name="trash" /> Delete
              </div>
            )}
          </ConfirmStatusChange>
        </Menu.Item>
      )}
      {canExport && (
        <Menu.Item
          role="button"
          tabIndex={0}
          onClick={() => handleBulkDashboardExport([dashboard])}
        >
          <ListViewCard.MenuIcon name="share" /> Export
        </Menu.Item>
      )}
      {canEdit && openDashboardEditModal && (
        <Menu.Item
          role="button"
          tabIndex={0}
          onClick={() =>
            openDashboardEditModal && openDashboardEditModal(dashboard)
          }
        >
          <ListViewCard.MenuIcon name="edit-alt" /> Edit
        </Menu.Item>
      )}
    </Menu>
  );
  return (
    <ListViewCard
      loading={dashboard.loading || false}
      title={dashboard.dashboard_title}
      titleRight={<Label>{dashboard.published ? 'published' : 'draft'}</Label>}
      url={bulkSelectEnabled ? undefined : dashboard.url}
      imgURL={dashboard.thumbnail_url}
      imgFallbackURL="/static/assets/images/dashboard-card-fallback.png"
      description={t('Last modified %s', dashboard.changed_on_delta_humanized)}
      coverLeft={<FacePile users={dashboard.owners || []} />}
      actions={
        <ListViewCard.Actions>
          <FaveStar
            itemId={dashboard.id}
            fetchFaveStar={fetchFaveStar}
            saveFaveStar={saveFaveStar}
            isStarred={!!favoriteStatus[dashboard.id]}
          />
          <Dropdown overlay={menu}>
            <Icon name="more-horiz" />
          </Dropdown>
        </ListViewCard.Actions>
      }
      showImg
    />
  );
}

export default DashboardCard;
