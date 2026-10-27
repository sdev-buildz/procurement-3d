<div align="center">
  <h1>🛒 Shopping Site Example</h1>
  <p><strong>Full-stack demonstration of seamless multi-tab state synchronization</strong></p>
</div>

This example showcases [Apollo State Sync](../../README.md) and [Apollo Shared WS](../../packages/apollo-shared-ws/README.md) integrated into a functional e-commerce application. It demonstrates a unified user experience where state and data remain consistent across all open browser tabs and windows.

### 🔑 Key Synchronized Features:

- **Authentication & Cart:** Login status and shopping cart contents stay in sync instantly.
- **UI Preferences:** Dark/light mode settings are applied globally across the session.
- **Shared Resources:** A unified in-memory cache and a single shared WebSocket connection for real-time product update notifications.

## 📺 Watch the Demo Video:

https://github.com/user-attachments/assets/18df5e73-f7a6-417f-8398-2bb8251ccc3e

## 🛠️ Prerequisites

- Node.js 22 or newer
- pnpm

Install dependencies:

```sh
pnpm ci
```

## 🚀 Run the example

Start the API server:

```sh
pnpm run --filter=@examples/shopping-site start-server-watch
```

In a second terminal, start the React development server:

```sh
pnpm run --filter=@examples/shopping-site start-react-watch
```

Open [https://localhost:3000](https://localhost:3000). The API server listens
on [https://localhost:443](https://localhost:443) by default. The API
server uses the self-signed certificates in `server/cert/`.

> [!IMPORTANT]
> **HTTPS & SharedWorker Security**  
> Because this example uses `SharedWorker` over HTTPS, browsers will block WebSocket connections to self-signed certificates by default. To run the demo successfully, launch your browser with the [`--ignore-certificate-errors`](https://stackoverflow.com/a/31613323/33099159) flag.

To use different ports, set `PORT` for the API server and `WEB_CLIENT_PORT` for the client server in the `.env` file.

## 🧪 Try the Demo

1. **Open Multiple Tabs:** Launch the application in two or more side-by-side browser windows.
2. **Cross-Tab Synchronization:** Sign in or add items to the cart in one tab. Observe how the other tabs update instantly without a page refresh.
3. **State Persistence:** Close and reopen your browser to verify that your login session and cart state are automatically restored.
4. **Shared Subscriptions:** Add products to your cart and click **Checkout**. Real-time stock update notifications will appear across all open tabs, powered by a single shared WebSocket connection.

The GraphQL endpoint is available at [https://localhost:443/api/graphql](https://localhost:443/api/graphql).
GraphiQL is hosted at the endpoint.
