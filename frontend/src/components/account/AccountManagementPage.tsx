import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useSearch } from 'wouter';
import Header from '@/components/Header';
import SideNav from '@/components/b2b-agent/SideNav';
import Breadcrumb from '@/components/b2b-agent/Breadcrumb';
import { useToast } from '@/hooks/use-toast';
import { refreshCurrentUser, useCurrentUser } from '@/hooks/useCurrentUser';
import { clearSelectedPatientId } from '@/utils/selectedPatient';
import ClinicInformationForm, { type ClinicFormValues } from './ClinicInformationForm';
import AccountUsersPanel from './AccountUsersPanel';
import PaymentSetupForm, { type PaymentSetupPayload } from './PaymentSetupForm';
import PaymentHistoryPanel from './PaymentHistoryPanel';
import type { Account, AccountPayment, AccountPaymentMethod, AccountUser } from './types';

/** Which sub-page of Account Management is open. */
type AccountSection = 'clinic' | 'users' | 'payment';

/** The two halves of Payment Settings, shown as tabs on the one page. */
type PaymentTab = 'setup' | 'history';

const CLINIC_PATH = '/b2b-agent/account/clinic';
const PAYMENT_PATH = '/b2b-agent/account/payment';

/** Sub-page headings, so the title and the nav label always agree. */
const SECTION_HEADINGS: Record<AccountSection, { title: string; description: string }> = {
  clinic: { title: 'Clinic Profile', description: 'Clinic details used on insurance verifications.' },
  users: { title: 'Team Members', description: 'Everyone who signs in under this clinic account.' },
  payment: { title: 'Payment Settings', description: 'How this clinic pays for InSpline, and what it has been billed.' },
};

/** The sub-page a path opens. Unknown paths land on the clinic form. */
const sectionForPath = (path: string): AccountSection => {
  if (path.endsWith('/users')) return 'users';
  if (path.endsWith('/payment')) return 'payment';
  return 'clinic';
};

const PAYMENT_TABS: { id: PaymentTab; label: string; icon: string }[] = [
  { id: 'setup', label: 'Payment Setup', icon: 'credit_card' },
  { id: 'history', label: 'Payment History', icon: 'receipt_long' },
];

const AccountManagementPage: React.FC = () => {
  const [location, navigate] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const { user } = useCurrentUser();

  const [account, setAccount] = useState<Account | null>(null);
  const [users, setUsers] = useState<AccountUser[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<AccountPaymentMethod | null>(null);
  const [payments, setPayments] = useState<AccountPayment[]>([]);
  const [paymentFieldErrors, setPaymentFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const path = location.split('?')[0];
  const section: AccountSection = sectionForPath(path);
  const isBillingSection = section === 'payment';
  // The open payment tab rides in the URL, so an invoice link can be shared.
  const paymentTab: PaymentTab =
    new URLSearchParams(search).get('tab') === 'history' ? 'history' : 'setup';

  // Clinic details belong to the manager; dental users read them.
  const isManager = user?.role === 'manager';

  // The section landing page is the clinic form; keep the URL honest about it.
  // Payment History used to be its own page, so old links land on its tab.
  useEffect(() => {
    if (path === '/b2b-agent/account') navigate(CLINIC_PATH, { replace: true });
    if (path === '/b2b-agent/account/payment-history') {
      navigate(`${PAYMENT_PATH}?tab=history`, { replace: true });
    }
  }, [path, navigate]);

  const loadAccount = useCallback(async () => {
    try {
      // Billing is manager-only on the server; asking as a dental user just 403s,
      // so the two requests are only made once the role is known to be manager.
      const billingRequests = isManager
        ? [
            fetch('/api/account/payment-method', { credentials: 'include' }),
            fetch('/api/account/payments', { credentials: 'include' }),
          ]
        : [];

      const [accountResponse, usersResponse, paymentMethodResponse, paymentsResponse] = await Promise.all([
        fetch('/api/account', { credentials: 'include' }),
        fetch('/api/account/users', { credentials: 'include' }),
        ...billingRequests,
      ]);

      if (accountResponse.status === 401) {
        navigate('/');
        return;
      }

      if (!accountResponse.ok) {
        const data = await accountResponse.json().catch(() => ({}));
        setLoadError(data.error || 'Failed to load clinic information');
        return;
      }

      setAccount(await accountResponse.json());
      setUsers(usersResponse.ok ? await usersResponse.json() : []);
      setPaymentMethod(paymentMethodResponse?.ok ? await paymentMethodResponse.json() : null);
      setPayments(paymentsResponse?.ok ? await paymentsResponse.json() : []);
      setLoadError(null);
    } catch {
      setLoadError('Failed to load clinic information');
    } finally {
      setIsLoading(false);
    }
  }, [navigate, isManager]);

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      clearSelectedPatientId();
      navigate('/');
    } catch {
      navigate('/');
    }
  };

  const handleSave = async (values: ClinicFormValues): Promise<Account> => {
    const response = await fetch('/api/account', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(values),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // Field-level messages are shown inline; the toast carries the summary.
      const details: { field: string; message: string }[] = data.details ?? [];
      setFieldErrors(Object.fromEntries(details.map((detail) => [detail.field, detail.message])));

      toast({
        variant: 'error',
        title: 'Clinic information not saved',
        description: data.error || 'Please check the highlighted fields and try again.',
      });
      throw new Error(data.error || 'Failed to update clinic information');
    }

    setFieldErrors({});
    setAccount(data);
    // The header shows the clinic name, so re-verify the session behind it.
    await refreshCurrentUser();

    toast({
      variant: 'success',
      title: 'Clinic information saved',
      description: 'Your account details have been updated.',
    });

    return data as Account;
  };

  const handleSavePayment = async (values: PaymentSetupPayload): Promise<AccountPaymentMethod> => {
    const response = await fetch('/api/account/payment-method', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(values),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const details: { field: string; message: string }[] = data.details ?? [];
      setPaymentFieldErrors(Object.fromEntries(details.map((detail) => [detail.field, detail.message])));

      toast({
        variant: 'error',
        title: 'Payment setup not saved',
        description: data.error || 'Please check the highlighted fields and try again.',
      });
      throw new Error(data.error || 'Failed to save payment setup');
    }

    setPaymentFieldErrors({});
    setPaymentMethod(data);

    toast({
      variant: 'success',
      title: 'Payment setup saved',
      description: 'Invoices will be billed to the method on file.',
    });

    return data as AccountPaymentMethod;
  };

  const renderBody = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-24">
          <span className="material-symbols-outlined animate-spin text-4xl text-slate-400">progress_activity</span>
        </div>
      );
    }

    if (loadError || !account) {
      return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-10 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">domain_disabled</span>
          <h2 className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
            {loadError || 'No clinic is assigned to this user'}
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Ask your InSpline administrator to assign your login to a clinic.
          </p>
        </div>
      );
    }

    if (section === 'users') {
      return <AccountUsersPanel account={account} users={users} currentUserId={user?.id} />;
    }

    // Billing belongs to the manager; a dental user reaching the URL is told why.
    if (isBillingSection && !isManager) {
      return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-10 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">lock</span>
          <h2 className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
            Billing is managed by a clinic manager
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Ask a manager on {account.name} for the clinic's payment setup and invoices.
          </p>
        </div>
      );
    }

    if (section === 'payment') {
      return (
        <div className="space-y-4">
          <div className="border-b border-slate-200 dark:border-slate-700">
            <nav className="-mb-px flex space-x-8" aria-label="Payment settings">
              {PAYMENT_TABS.map((tab) => {
                const isActive = paymentTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => navigate(`${PAYMENT_PATH}?tab=${tab.id}`, { replace: true })}
                    aria-current={isActive ? 'page' : undefined}
                    className={`${
                      isActive
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300'
                    } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                  >
                    <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {paymentTab === 'history' ? (
            <PaymentHistoryPanel account={account} payments={payments} paymentMethod={paymentMethod} />
          ) : (
            <PaymentSetupForm
              paymentMethod={paymentMethod}
              onSave={handleSavePayment}
              fieldErrors={paymentFieldErrors}
              canEdit={isManager}
            />
          )}
        </div>
      );
    }

    return (
      <ClinicInformationForm
        account={account}
        onSave={handleSave}
        fieldErrors={fieldErrors}
        canEdit={isManager}
      />
    );
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
      <Header
        onLogoClick={() => navigate('/b2b-agent/dashboard')}
        onLogout={handleLogout}
      />

      <main className="flex flex-1 overflow-hidden">
        <SideNav />

        <div className="min-w-0 flex-1 overflow-y-auto">
          <div className="w-full p-4 space-y-4">
            <div>
              <Breadcrumb className="mb-2" />
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                {SECTION_HEADINGS[section].title}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {section === 'clinic' && isManager
                  ? 'Clinic details used on insurance verifications — keep them current.'
                  : SECTION_HEADINGS[section].description}
              </p>
            </div>

            {renderBody()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AccountManagementPage;
