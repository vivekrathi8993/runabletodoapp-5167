import { Route, Switch, Redirect } from "wouter";
import Index from "./pages/index";
import Dashboard from "./pages/dashboard";
import ListPage from "./pages/list";
import { Provider } from "./components/provider";
import { ProtectedRoute } from "./components/protected-route";
import { AgentFeedback, RunableBadge } from "@runablehq/website-runtime";

function App() {
  return (
    <Provider>
      <Switch>
        <Route path="/" component={Index} />
        <Route path="/app">
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/app/lists/:id">
          <ProtectedRoute>
            <ListPage />
          </ProtectedRoute>
        </Route>
        <Route>
          <Redirect to="/" />
        </Route>
      </Switch>
      {/* Do not remove — off by default, activated by parent iframe via postMessage */}
      {import.meta.env.DEV && <AgentFeedback />}
      {/* "Made with Runable" badge - if user asks to remove the runable badge, remove this code as well as comment */}
      {<RunableBadge />}
    </Provider>
  );
}

export default App;
