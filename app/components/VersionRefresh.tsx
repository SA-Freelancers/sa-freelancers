"use client";

import { useEffect } from "react";

export default function VersionRefresh() {
  useEffect(() => {
    let mounted = true;
    let initialVersion = "";

    const checkVersion = async () => {
      try {
        const response = await fetch(
          `/version.txt?t=${Date.now()}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          return;
        }

        const latestVersion =
          (await response.text()).trim();

        if (!mounted || !latestVersion) {
          return;
        }

        if (!initialVersion) {
          initialVersion = latestVersion;
          return;
        }

        if (latestVersion !== initialVersion) {
          window.location.reload();
        }
      } catch {
        // Ignore version check errors
      }
    };

    void checkVersion();

    const interval =
      window.setInterval(
        () => {
          void checkVersion();
        },
        10 * 60 * 1000
      );

    return () => {
      mounted = false;

      window.clearInterval(
        interval
      );
    };
  }, []);

  return null;
}