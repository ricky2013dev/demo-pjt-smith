import { Router, Route, Switch } from 'wouter';
import HomePage from '@/components/HomePage';
import PatientsManagement from '@/components/b2b-agent/PatientsManagement';
import PatientDetailPage from '@/components/b2b-agent/PatientDetailPage';
import SmartAITransactionHistory from '@/components/b2b-agent/SmartAITransactionHistory';
import DailyJobDashboard from '@/components/b2b-agent/DailyJobDashboard';
import StediApiTester from '@/components/admin/StediApiTester';
import UserManagement from '@/components/admin/UserManagement';
import UserRelatedData from '@/components/admin/UserRelatedData';
import SystemRelatedData from '@/components/admin/SystemRelatedData';
import { StediApiProvider } from '@/context/StediApiContext';
import { Toaster } from '@/components/ui/toaster';

function App() {
  return (
    <StediApiProvider>
      <Router>
        <Switch>
          <Route path="/" component={() => <HomePage />} />
          <Route path="/b2b-agent/dashboard" component={() => <DailyJobDashboard />} />
          <Route path="/b2b-agent/patient-detail" component={() => <PatientDetailPage />} />
          <Route path="/b2b-agent/patient-appointments" component={() => <PatientsManagement />} />
          <Route path="/b2b-agent/smart-ai-transaction-history" component={() => <SmartAITransactionHistory />} />
          <Route path="/admin/stedi-api-tester" component={() => <StediApiTester />} />
          <Route path="/admin/users" component={() => <UserManagement />} />
          <Route path="/admin/user-data" component={() => <UserRelatedData />} />
          <Route path="/admin/system-data" component={() => <SystemRelatedData />} />
          <Route path="/dashboard" component={() => <DailyJobDashboard />} />
          <Route path="/patient-appointments" component={() => <PatientsManagement />} />
          <Route path="/smart-ai-transaction-history" component={() => <SmartAITransactionHistory />} />
          <Route>
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <h1 className="text-4xl font-bold mb-4">404 - Not Found</h1>
                <a href="/" className="text-blue-500 hover:underline">Go home</a>
              </div>
            </div>
          </Route>
        </Switch>
      </Router>
      <Toaster />
    </StediApiProvider>
  );
}

export default App;
