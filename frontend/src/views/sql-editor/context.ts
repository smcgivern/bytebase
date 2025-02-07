import Emittery from "emittery";
import type { InjectionKey, Ref } from "vue";
import { computed, inject, provide, ref } from "vue";
import { useSQLEditorStore, useSettingV1Store } from "@/store";
import type { ComposedDatabase, SQLEditorTab } from "@/types";
import { DatabaseChangeMode } from "@/types/proto/v1/setting_service";
import type { Worksheet } from "@/types/proto/v1/worksheet_service";

export type AsidePanelTab = "SCHEMA" | "WORKSHEET" | "HISTORY";

type SQLEditorEvents = Emittery<{
  "save-sheet": {
    tab: SQLEditorTab;
    editTitle?: boolean;
    mask?: Array<keyof Worksheet>;
  };
  "alter-schema": {
    // Format: instances/{instance}/databases/{database}
    databaseName: string;
    schema: string;
    table: string;
  };
  "format-content": undefined;
  "tree-ready": undefined;
  "project-context-ready": {
    project: string;
  };
  "set-editor-selection": {
    start: { line: number; column: number };
    end?: { line: number; column: number };
  };
}>;

export type SQLEditorContext = {
  asidePanelTab: Ref<AsidePanelTab>;
  showConnectionPanel: Ref<boolean>;
  showAIChatBox: Ref<boolean>;
  schemaViewer: Ref<
    | {
        database: ComposedDatabase;
        schema?: string;
        table?: string;
      }
    | undefined
  >;
  standardModeEnabled: Ref<boolean>;

  events: SQLEditorEvents;

  maybeSwitchProject: (project: string) => Promise<string>;
};

export const KEY = Symbol(
  "bb.sql-editor.context"
) as InjectionKey<SQLEditorContext>;

export const useSQLEditorContext = () => {
  return inject(KEY)!;
};

export const provideSQLEditorContext = () => {
  const editorStore = useSQLEditorStore();
  const context: SQLEditorContext = {
    asidePanelTab: ref("WORKSHEET"),
    showConnectionPanel: ref(false),
    showAIChatBox: ref(false),
    schemaViewer: ref(undefined),
    events: new Emittery(),
    standardModeEnabled: computed(() => {
      return (
        useSettingV1Store().workspaceProfileSetting?.databaseChangeMode ===
        DatabaseChangeMode.EDITOR
      );
    }),

    maybeSwitchProject: (project) => {
      if (editorStore.project !== project) {
        editorStore.project = project;
        return context.events.once("project-context-ready").then(() => project);
      }
      return Promise.resolve(editorStore.project);
    },
  };

  provide(KEY, context);

  return context;
};
