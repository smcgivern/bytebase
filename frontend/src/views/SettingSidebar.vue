<template>
  <CommonSidebar
    :key="'setting'"
    :item-list="settingSidebarItemList"
    :get-item-class="getItemClass"
    :logo-redirect="WORKSPACE_ROUTE_MY_ISSUES"
    @select="onSelect"
  >
    <template #prefix>
      <div class="px-2.5 mb-2">
        <router-link
          class="group flex items-center gap-2 px-2 py-1.5 leading-normal font-medium rounded-md text-main outline-item !text-base"
          :to="{ name: WORKSPACE_ROUTE_MY_ISSUES }"
        >
          <ChevronLeftIcon class="w-5 h-5" />
          <span>{{ $t("common.setting") }}</span>
        </router-link>
      </div>
    </template>
  </CommonSidebar>
</template>

<script lang="ts" setup>
import {
  UserCircle,
  Building,
  Archive,
  ChevronLeftIcon,
} from "lucide-vue-next";
import { computed, h } from "vue";
import { useI18n } from "vue-i18n";
import type { RouteRecordRaw } from "vue-router";
import { useRoute, useRouter } from "vue-router";
import type { SidebarItem } from "@/components/CommonSidebar.vue";
import CommonSidebar from "@/components/CommonSidebar.vue";
import { WORKSPACE_ROUTE_MY_ISSUES } from "@/router/dashboard/workspaceRoutes";
import workspaceSettingRoutes, {
  SETTING_ROUTE_PROFILE,
  SETTING_ROUTE_PROFILE_TWO_FACTOR,
  SETTING_ROUTE_WORKSPACE_GENERAL,
  SETTING_ROUTE_WORKSPACE_SUBSCRIPTION,
  SETTING_ROUTE_WORKSPACE_ARCHIVE,
  SETTING_ROUTE_WORKSPACE,
} from "@/router/dashboard/workspaceSetting";
import {
  hasWorkspaceLevelProjectPermissionInAnyProject,
  hasWorkspacePermissionV2,
} from "@/utils";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const getItemClass = (item: SidebarItem) => {
  const list = [];
  if (route.name === item.name) {
    list.push("router-link-active", "bg-link-hover");
    return list;
  }

  switch (route.name) {
    case SETTING_ROUTE_PROFILE_TWO_FACTOR:
      if (item.name === SETTING_ROUTE_PROFILE) {
        list.push("router-link-active", "bg-link-hover");
      }
      break;
  }
  return list;
};

const onSelect = (item: SidebarItem, e: MouseEvent | undefined) => {
  if (!item.name) {
    return;
  }
  const route = router.resolve({
    name: item.name,
  });

  if (e?.ctrlKey || e?.metaKey) {
    window.open(route.fullPath, "_blank");
  } else {
    router.replace(route);
  }
};

const settingSidebarItemList = computed((): SidebarItem[] => {
  const list: SidebarItem[] = [
    {
      title: t("settings.sidebar.account"),
      icon: () => h(UserCircle),
      type: "div",
      expand: true,
      children: [
        {
          title: t("settings.sidebar.profile"),
          name: SETTING_ROUTE_PROFILE,
          type: "route",
        },
      ],
    },
    {
      title: t("settings.sidebar.workspace"),
      icon: () => h(Building),
      type: "div",
      expand: true,
      children: [
        {
          title: t("settings.sidebar.general"),
          name: SETTING_ROUTE_WORKSPACE_GENERAL,
          type: "route",
        },
        {
          title: t("settings.sidebar.subscription"),
          name: SETTING_ROUTE_WORKSPACE_SUBSCRIPTION,
          type: "route",
        },
      ],
    },
    {
      title: t("common.archived"),
      icon: () => h(Archive),
      name: SETTING_ROUTE_WORKSPACE_ARCHIVE,
      type: "route",
    },
  ];

  const checkSidebarItemPermission = (item: SidebarItem) => {
    if (item.name) {
      item.hide = !hasRoutePermission(item.name);
    }
    if (item.children) {
      item.children.forEach((child) => {
        checkSidebarItemPermission(child);
      });
    }
  };
  list.forEach((item) => {
    checkSidebarItemPermission(item);
  });

  return list;
});

const routes = workspaceSettingRoutes.find(
  (route) => route.name === SETTING_ROUTE_WORKSPACE
)?.children as RouteRecordRaw[];

const hasRoutePermission = (routeName: string) => {
  const route = routes.find((route) => route.name === routeName);
  if (!route) {
    return false;
  }

  if (route.meta?.requiredWorkspacePermissionList) {
    const requiredPermissions = route.meta.requiredWorkspacePermissionList();
    return requiredPermissions.every((permission) =>
      hasWorkspacePermissionV2(permission)
    );
  } else if (route.meta?.requiredProjectPermissionList) {
    const requiredPermissions = route.meta.requiredProjectPermissionList();
    return requiredPermissions.every((permission) =>
      hasWorkspaceLevelProjectPermissionInAnyProject(permission)
    );
  }

  return true;
};
</script>
