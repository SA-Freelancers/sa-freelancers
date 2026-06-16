"use client";

import { useEffect } from "react";

export default function VersionRefresh() {
  useEffect(() => {
    let currentVersion = "";

    const checkVersion = async () => {
      try {
        const res = await fetch("/version.txt", {
          cache: "no-store",
        });

        const latestVersion = (await res.text()).trim();

        if (!currentVersion) {
          currentVersion = latestVersion;
          return;
        }

        if (latestVersion && latestVersion !== currentVersion) {
          window.location.reload();
        }
      } catch {
        // Ignore version check errors
      }
    };

    checkVersion();

    const interval = setInterval(checkVersion, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return null;
}