/**
 * Sign-in screens. LoginModal is the entry point; SsoSignInMock is the demo
 * stand-in for a real OAuth popup that it opens for Google and Microsoft.
 */
export { default as LoginModal } from './LoginModal';
export {
    default as SsoSignInMock,
    GoogleLogo,
    MicrosoftLogo,
    MOCK_DENTAL_ACCOUNTS,
    MOCK_ADMIN_ACCOUNTS,
    type SsoProvider,
    type MockSsoAccount,
} from './SsoSignInMock';
