import { AppShell } from "./app/AppShell";
import { ErrorBoundary } from "./app/ErrorBoundary";
import { OpsStoreProvider } from "./state/useOpsStore";

const App = () => (
  <ErrorBoundary>
    <OpsStoreProvider>
      <AppShell />
    </OpsStoreProvider>
  </ErrorBoundary>
);

export default App;
