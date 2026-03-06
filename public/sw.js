self.addEventListener("push", function (event) {
  let data = {
    title: "MA-Fliesen App",
    body: "Neue Benachrichtigung",
    url: "/",
  };

  try {
    if (event.data) {
      const parsed = event.data.json();

      data = {
        title: typeof parsed.title === "string" ? parsed.title : "MA-Fliesen App",
        body: typeof parsed.body === "string" ? parsed.body : "Neue Benachrichtigung",
        url: typeof parsed.url === "string" ? parsed.url : "/",
      };
    }
  } catch (err) {
    console.error("Push payload konnte nicht gelesen werden:", err);
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon_2.jpeg",
      badge: "/icon_2.jpeg",
      data: {
        url: data.url || "/",
      },
    })
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const targetUrl =
    event.notification &&
    event.notification.data &&
    typeof event.notification.data.url === "string"
      ? event.notification.data.url
      : "/";

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

      return Promise.resolve();
    })
  );
});