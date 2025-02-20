import { MessageBoxOptions, app, dialog } from "electron";

export function noUpdatesAvailableDialog() {
  const dialogOpts: MessageBoxOptions = {
    type: "info",
    title: "Already up to date",
    message: "Already up to date",
    detail: `Swach ${app.getVersion()} is the latest version available.`,
  };

  return dialog.showMessageBox(dialogOpts);
}

export function restartDialog() {
  const dialogOpts: MessageBoxOptions = {
    type: "question",
    buttons: ["Restart", "Later"],
    title: "Restart Required",
    message: "Restart now?",
    detail: "A restart is required to apply this setting. Restart now?",
    defaultId: 0,
  };

  return dialog.showMessageBox(dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) {
      app.relaunch();
      app.exit();
    }
  });
}
