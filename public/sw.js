self.addEventListener("push", function (event) {
  let data = {
    title: "MA-Fliesen App",
    body: "Neue Benachrichtigung",
    url: "/admin/dashboard",
  };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (err) {
    console.error("Push payload konnte nicht gelesen werden:", err);
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: {
        url: data.url || "/admin/dashboard",
      },
    })
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const targetUrl =
    (event.notification &&
      event.notification.data &&
      event.notification.data.url) ||
    "/admin/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          if ("navigate" in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});