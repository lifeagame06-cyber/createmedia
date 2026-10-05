(function () {

    const style = document.createElement("style");

    style.textContent = `
        .createMedia-top-notification {
            position: fixed;
            top: 18px;
            left: 50%;
            transform: translate(-50%, -20px);
            width: calc(100% - 32px);
            max-width: 460px;
            padding: 16px 17px;
            display: flex;
            align-items: center;
            gap: 13px;
            background: #ffffff;
            border: 1px solid rgba(0,0,0,0.08);
            border-radius: 16px;
            box-shadow: 0 18px 50px rgba(0,0,0,0.18);
            z-index: 999999;
            opacity: 0;
            visibility: hidden;
            transition:
                opacity .3s ease,
                transform .3s ease,
                visibility .3s ease;
            box-sizing: border-box;
            font-family: Arial, sans-serif;
        }

        .createMedia-top-notification.show {
            opacity: 1;
            visibility: visible;
            transform: translate(-50%, 0);
        }

        .createMedia-notification-icon {
            width: 42px;
            height: 42px;
            flex: 0 0 42px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #e9f8ef;
            color: #168447;
            border-radius: 50%;
            font-size: 19px;
            font-weight: 800;
        }

        .createMedia-notification-content {
            min-width: 0;
            flex: 1;
        }

        .createMedia-notification-content strong {
            display: block;
            margin-bottom: 4px;
            color: #171717;
            font-size: 14px;
        }

        .createMedia-notification-content p {
            margin: 0;
            color: #646b70;
            font-size: 12px;
            line-height: 1.45;
        }

        .createMedia-notification-publish {
            border: none;
            padding: 9px 12px;
            background: #111;
            color: #fff;
            border-radius: 9px;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            white-space: nowrap;
        }

        .createMedia-notification-close {
            position: absolute;
            top: 5px;
            right: 7px;
            border: none;
            background: transparent;
            color: #999;
            font-size: 16px;
            cursor: pointer;
        }

        @media (max-width: 600px) {
            .createMedia-top-notification {
                top: 10px;
                width: calc(100% - 20px);
                padding: 14px 13px;
                border-radius: 14px;
            }

            .createMedia-notification-icon {
                width: 38px;
                height: 38px;
                flex-basis: 38px;
            }

            .createMedia-notification-publish {
                padding: 8px 10px;
            }
        }
    `;

    document.head.appendChild(style);

    let notificationClient = null;
    let activeNotificationId = null;


    async function getNotificationClient() {

        /* Use shared Supabase client if page already created it */
        if (window.supabaseClient) {
            return window.supabaseClient;
        }

        /*
          If the page does not have a Supabase client,
          notifications simply won't run on that page.

          This avoids creating another client with a blank key.
        */
        return null;
    }


    async function markNotificationRead(id) {

        const client = await getNotificationClient();

        if (!client) {
            return;
        }

        const { error } =
            await client
                .from("notifications")
                .update({
                    is_read: true
                })
                .eq("id", id);

        if (error) {
            console.error(
                "Notification read error:",
                error
            );
        }
    }


    function showEbookNotification(notification) {

        const oldToast =
            document.querySelector(
                ".createMedia-top-notification"
            );

        if (oldToast) {
            oldToast.remove();
        }


        const toast =
            document.createElement("div");

        toast.className =
            "createMedia-top-notification";


        const ebookTitle =
            notification.title || "Your ebook";


        toast.innerHTML = `
            <div class="createMedia-notification-icon">
                ✓
            </div>

            <div class="createMedia-notification-content">

                <strong>
                    Ebook Approved
                </strong>

                <p>
                    ${escapeHtml(ebookTitle)}
                    is ready to publish.
                </p>

            </div>

            <button
                type="button"
                class="createMedia-notification-publish">
                Publish Now
            </button>

            <button
                type="button"
                class="createMedia-notification-close"
                aria-label="Close">
                ×
            </button>
        `;


        document.body.appendChild(toast);


        activeNotificationId =
            notification.id;


        setTimeout(function () {

            toast.classList.add("show");

        }, 100);


        toast.querySelector(
            ".createMedia-notification-close"
        ).onclick = async function () {

            await markNotificationRead(
                notification.id
            );

            toast.classList.remove("show");

            setTimeout(function () {

                toast.remove();

            }, 300);
        };


        toast.querySelector(
            ".createMedia-notification-publish"
        ).onclick = async function () {

            await markNotificationRead(
                notification.id
            );

            window.location.href =
                "sell-ebook.html";
        };

    }


    async function checkForNotifications() {

        const client =
            await getNotificationClient();

        if (!client) {
            return;
        }


        const {
            data: { user },
            error: userError
        } =
            await client.auth.getUser();


        if (userError || !user) {
            return;
        }


        const { data, error } =
            await client
                .from("notifications")
                .select(
                    "id, type, title, message, is_read, created_at"
                )
                .eq("user_id", user.id)
                .eq("type", "ebook_approved")
                .eq("is_read", false)
                .order("created_at", {
                    ascending: false
                })
                .limit(1)
                .maybeSingle();


        if (error) {

            console.error(
                "Notification load error:",
                error
            );

            return;
        }


        if (
            data &&
            data.id !== activeNotificationId
        ) {
            showEbookNotification(data);
        }
    }


    function escapeHtml(value) {

        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }


    function startNotifications() {

        if (document.readyState === "loading") {

            document.addEventListener(
                "DOMContentLoaded",
                checkForNotifications,
                { once: true }
            );

        } else {

            checkForNotifications();
        }
    }


    startNotifications();

})();