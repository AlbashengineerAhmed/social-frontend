import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './features/auth/context/AuthContext';
import { AppRouter } from './app/router';
import { ToastContainer } from './components/ui/ToastContainer';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
        <ToastContainer />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
