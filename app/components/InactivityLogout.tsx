"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  supabase,
} from "@/app/lib/supabase";


/* =========================================================
   INACTIVITY SETTINGS
   ========================================================= */

const WARNING_AFTER_MS =
  4 * 60 * 1000;

const LOGOUT_AFTER_MS =
  5 * 60 * 1000;


/* =========================================================
   COMPONENT
   ========================================================= */

export default function InactivityLogout() {

  const router =
    useRouter();


  const [
    isAuthenticated,
    setIsAuthenticated,
  ] =
    useState(false);


  const [
    showWarning,
    setShowWarning,
  ] =
    useState(false);


  const authenticatedRef =
    useRef(false);


  const lastActivityRef =
    useRef(
      Date.now()
    );


  const warningVisibleRef =
    useRef(false);


  const loggingOutRef =
    useRef(false);


  /* =========================================================
     LOGOUT
     ========================================================= */

  const logout =
    useCallback(
      async () => {

        if (
          loggingOutRef.current
        ) {

          return;

        }


        loggingOutRef.current =
          true;


        warningVisibleRef.current =
          false;


        setShowWarning(
          false
        );


        try {

          await supabase.auth
            .signOut();

        } catch (
          error
        ) {

          console.error(
            "Automatic logout error:",
            error
          );

        }


        router.replace(
          "/login?reason=inactive"
        );

        router.refresh();

      },
      [
        router,
      ]
    );


  /* =========================================================
     RESET ACTIVITY
     ========================================================= */

  const resetActivity =
    useCallback(() => {

      if (
        !authenticatedRef.current
      ) {

        return;

      }


      /*
       * Once the warning is visible,
       * the user must explicitly click
       * Stay Logged In.
       */

      if (
        warningVisibleRef.current
      ) {

        return;

      }


      lastActivityRef.current =
        Date.now();

    }, []);


  /* =========================================================
     STAY LOGGED IN
     ========================================================= */

  const stayLoggedIn =
    useCallback(() => {

      lastActivityRef.current =
        Date.now();


      warningVisibleRef.current =
        false;


      setShowWarning(
        false
      );

    }, []);


  /* =========================================================
     INITIAL SESSION + AUTH CHANGES
     ========================================================= */

  useEffect(() => {

    let mounted =
      true;


    const initialise =
      async () => {

        const {
          data,
        } =
          await supabase.auth
            .getSession();


        if (
          !mounted
        ) {

          return;

        }


        const authenticated =
          Boolean(
            data.session
          );


        authenticatedRef.current =
          authenticated;


        setIsAuthenticated(
          authenticated
        );


        if (
          authenticated
        ) {

          lastActivityRef.current =
            Date.now();

        }

      };


    void initialise();


    const {
      data:
        authListener,
    } =
      supabase.auth
        .onAuthStateChange(
          (
            event,
            session
          ) => {

            const authenticated =
              Boolean(
                session
              );


            authenticatedRef.current =
              authenticated;


            setIsAuthenticated(
              authenticated
            );


            /*
             * IMPORTANT:
             *
             * Only a genuine sign-in resets
             * the inactivity clock.
             *
             * TOKEN_REFRESHED and other
             * background Supabase events
             * must NOT reset it.
             */

            if (
              event ===
              "SIGNED_IN"
            ) {

              lastActivityRef.current =
                Date.now();


              warningVisibleRef.current =
                false;


              loggingOutRef.current =
                false;


              setShowWarning(
                false
              );

            }


            if (
              event ===
              "SIGNED_OUT"
            ) {

              warningVisibleRef.current =
                false;


              setShowWarning(
                false
              );

            }

          }
        );


    return () => {

      mounted =
        false;


      authListener
        .subscription
        .unsubscribe();

    };

  }, []);


  /* =========================================================
     ACTIVITY LISTENERS
     ========================================================= */

  useEffect(() => {

    if (
      !isAuthenticated
    ) {

      return;

    }


    const events = [
      "pointerdown",
      "keydown",
      "scroll",
      "touchstart",
    ];


    events.forEach(
      (
        eventName
      ) => {

        window.addEventListener(
          eventName,
          resetActivity,
          {
            passive: true,
          }
        );

      }
    );


    return () => {

      events.forEach(
        (
          eventName
        ) => {

          window.removeEventListener(
            eventName,
            resetActivity
          );

        }
      );

    };

  }, [
    isAuthenticated,
    resetActivity,
  ]);


  /* =========================================================
     INACTIVITY CLOCK

     Check the REAL elapsed time every second.
     This cannot be reset by Supabase token refreshes.
     ========================================================= */

  useEffect(() => {

    if (
      !isAuthenticated
    ) {

      return;

    }


    const checkInactivity =
      () => {

        if (
          !authenticatedRef.current
        ) {

          return;

        }


        const now =
          Date.now();


        const inactiveFor =
          now -
          lastActivityRef.current;


        /*
         * 5 MINUTES
         * Automatic logout
         */

        if (
          inactiveFor >=
          LOGOUT_AFTER_MS
        ) {

          void logout();

          return;

        }


        /*
         * 4 MINUTES
         * Display warning
         */

        if (
          inactiveFor >=
          WARNING_AFTER_MS
        ) {

          if (
            !warningVisibleRef.current
          ) {

            warningVisibleRef.current =
              true;


            setShowWarning(
              true
            );

          }

        }

      };


    /*
     * Check immediately.
     */

    checkInactivity();


    /*
     * Then check every second.
     */

    const interval =
      window.setInterval(
        checkInactivity,
        1000
      );


    return () => {

      window.clearInterval(
        interval
      );

    };

  }, [
    isAuthenticated,
    logout,
  ]);


  /* =========================================================
     PAGE RETURN
     ========================================================= */

  if (
    !isAuthenticated ||
    !showWarning
  ) {

    return null;

  }


  return (

    <div
      className="inactivity-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inactivity-title"
    >

      <div
        className="inactivity-modal"
      >

        <div
          className="inactivity-icon"
        >
          ⏱
        </div>


        <p
          className="inactivity-eyebrow"
        >
          Session security
        </p>


        <h2
          id="inactivity-title"
        >
          Are you still there?
        </h2>


        <p
          className="inactivity-message"
        >
          You&apos;ve been inactive for
          4 minutes. For your security,
          Freelance Hub SA will
          automatically log you out in
          approximately 1 minute.
        </p>


        <div
          className="inactivity-actions"
        >

          <button
            type="button"
            className="inactivity-stay"
            onClick={
              stayLoggedIn
            }
          >
            Stay Logged In
          </button>


          <button
            type="button"
            className="inactivity-logout"
            onClick={() => {

              void logout();

            }}
          >
            Log Out Now
          </button>

        </div>

      </div>

    </div>

  );

}