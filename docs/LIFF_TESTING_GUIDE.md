# LIFF Testing & Debugging Guide

## Table of Contents
1. [UI/UX Optimization](#uiux-optimization)
2. [LIFF URL Testing](#liff-url-testing)
3. [Debugging Common Errors](#debugging-common-errors)
4. [Testing Tools](#testing-tools)
5. [Best Practices](#best-practices)

## UI/UX Optimization

### Screen Dimensions & LIFF Sizes

LIFF apps can be displayed in three sizes within LINE:

| Size | Viewport | Use Case | CSS Class |
|------|----------|----------|-----------|
| **Compact** | 100% width, 50% height | Quick actions, forms | `.liff-compact` |
| **Tall** | 100% width, 75% height | Most interactions | `.liff-tall` |
| **Full** | 100% width, 100% height | Full app experience | `.liff-full` |

### Design Guidelines for LINE Integration

#### 1. **Color Palette**
```css
/* Use LINE's official colors */
--line-primary: #06C755;        /* LINE Green */
--line-primary-dark: #05A647;   /* Pressed state */
--line-text: #2E2E2E;          /* Primary text */
--line-bg: #F7F8FA;            /* Background */
```

#### 2. **Typography**
- **Font Family**: System fonts (-apple-system, "Helvetica Neue", "Hiragino Sans", "Yu Gothic")
- **Font Sizes**:
  - Body: 15px
  - Small: 13px
  - Large: 17px
  - Title: 20px

#### 3. **Component Spacing**
```css
/* Mobile-optimized spacing */
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
```

#### 4. **Touch Targets**
- Minimum size: 44x44px (iOS) / 48x48px (Android)
- Add padding around small elements
- Use full-width buttons for primary actions

#### 5. **Safe Areas (Notched Devices)**
```css
.liff-safe-area {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}
```

### Responsive Design Tips

#### Handle Different Viewports
```javascript
// Detect LIFF size
const getLiffSize = () => {
  const ratio = window.innerHeight / window.screen.height;
  if (ratio < 0.6) return 'compact';
  if (ratio < 0.85) return 'tall';
  return 'full';
};
```

#### Viewport Height Fix (Mobile Browsers)
```javascript
// Fix for mobile browser address bar
const setViewportHeight = () => {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
};

window.addEventListener('resize', setViewportHeight);
window.addEventListener('orientationchange', setViewportHeight);
```

## LIFF URL Testing

### Step-by-Step Testing Process

#### 1. **Generate LIFF URL**
```
https://liff.line.me/{LIFF_ID}
```

Example:
```
https://liff.line.me/1234567890-abcdefgh
```

#### 2. **Add Parameters (Optional)**
```
https://liff.line.me/1234567890-abcdefgh?param1=value1&param2=value2
```

#### 3. **Testing Methods**

##### Method A: Direct URL in LINE Chat
1. Open LINE app
2. Send the LIFF URL to yourself (Keepmemo) or a friend
3. Tap the URL to open LIFF app
4. The app opens within LINE

##### Method B: QR Code
1. Generate QR code for your LIFF URL:
```javascript
const liffUrl = 'https://liff.line.me/1234567890-abcdefgh';
const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(liffUrl)}`;
```

2. Open LINE app > Add Friend > QR Code
3. Scan the generated QR code
4. LIFF app opens automatically

##### Method C: Rich Menu (Production)
1. Create Rich Menu in LINE Official Account Manager
2. Set action type to "Link"
3. Enter LIFF URL
4. Users tap rich menu to open LIFF app

##### Method D: LIFF Debugger (Development)
1. Install LIFF Inspector Chrome extension
2. Open your app with `?liff.state=debug`
3. Use developer tools to debug

### Testing Checklist

```markdown
□ Test in actual LINE app (iOS and Android)
□ Test all LIFF sizes (compact, tall, full)
□ Test with logged-in user
□ Test with non-logged-in user
□ Test offline behavior
□ Test on different devices
□ Test orientation changes
□ Test with slow network (3G throttling)
□ Test deep linking with parameters
□ Test close/back button behavior
```

## Debugging Common Errors

### 1. `liff.init()` Failures

#### Error: "Invalid LIFF ID"
```javascript
// Problem
liff.init({ liffId: 'invalid-id' });

// Solution
liff.init({ liffId: '1234567890-abcdefgh' }); // Use valid LIFF ID from console
```

**Diagnosis Steps:**
1. Verify LIFF ID in LINE Developers Console
2. Check environment variables are loaded
3. Ensure no typos in LIFF ID

#### Error: "HTTPS Required"
```javascript
// Problem: Running on HTTP
http://localhost:3000

// Solutions:
// 1. Use HTTPS in production
https://your-domain.com

// 2. Use ngrok for local testing
ngrok http 3000
// Then use: https://xxxxx.ngrok.io
```

#### Error: "Domain not allowed"
**Solution:**
1. Go to LINE Developers Console
2. Select your LIFF app
3. Add domain to "Endpoint URL"
4. Wait 5-10 minutes for propagation

### 2. Console Errors & Solutions

#### "liff is not defined"
```javascript
// Problem: LIFF SDK not loaded
// Solution: Ensure SDK is loaded before use
<script src="https://static.line-scdn.net/liff/edge/2/sdk.js"></script>

// Or with npm
import liff from '@line/liff';
```

#### "Unauthorized"
```javascript
// Problem: User not logged in
if (!liff.isLoggedIn()) {
  liff.login(); // Redirect to LINE login
}
```

#### "Cannot read property 'userId' of null"
```javascript
// Problem: Trying to access profile before login
// Solution: Check login status first
if (liff.isLoggedIn()) {
  const profile = await liff.getProfile();
  console.log(profile.userId);
}
```

### 3. Network & CORS Issues

#### CORS Error
```
Access to fetch at 'https://api.line.me/...' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solutions:**
1. Use LIFF's built-in methods instead of direct API calls
2. Proxy requests through your backend
3. Ensure you're testing in actual LINE app

### 4. Debugging Tools

#### Enable Debug Mode
```javascript
import { initLiffTesting } from '@/utils/liffTesting';

// Enable debug mode
initLiffTesting({
  liffId: 'your-liff-id',
  debugMode: true,
  logLevel: 'debug'
});
```

#### Test LIFF Initialization
```javascript
import { testLiffInit, diagnoseLiffError } from '@/utils/liffTesting';

// Test with detailed logging
const result = await testLiffInit();
if (!result.success) {
  const diagnosis = diagnoseLiffError(result.error);
  console.log('Cause:', diagnosis.cause);
  console.log('Solution:', diagnosis.solution);
  console.log('Checkpoints:', diagnosis.checkpoints);
}
```

#### Browser DevTools Tips
1. **Network Tab**: Check for failed requests
2. **Console**: Look for JavaScript errors
3. **Application Tab**: Inspect localStorage/sessionStorage
4. **Mobile Emulation**: Test responsive design

## Testing Tools

### 1. LIFF Simulator (Official)
- URL: https://developers.line.biz/console/
- Features: Test without LINE app
- Limitations: Some APIs not available

### 2. ngrok (Local Testing)
```bash
# Install ngrok
npm install -g ngrok

# Start local server
npm run dev

# Create tunnel
ngrok http 3000

# Use generated HTTPS URL for testing
```

### 3. LIFF Inspector (Chrome Extension)
- Install from Chrome Web Store
- Features:
  - Inspect LIFF context
  - Mock LIFF APIs
  - Debug console

### 4. Custom Debug Panel
```javascript
// Add to your app for debugging
if (process.env.NODE_ENV === 'development') {
  import('@/utils/liffTesting').then(({ initLiffTesting }) => {
    initLiffTesting({
      liffId: process.env.NEXT_PUBLIC_LIFF_ID,
      debugMode: true,
      logLevel: 'debug'
    });
  });
}
```

## Best Practices

### 1. Performance Optimization
- Lazy load heavy components
- Minimize bundle size
- Use code splitting
- Optimize images (WebP, lazy loading)
- Cache API responses

### 2. Error Handling
```javascript
try {
  await liff.init({ liffId });
} catch (error) {
  // Show user-friendly error
  showError('Unable to load app. Please try again.');

  // Log detailed error for debugging
  console.error('LIFF init error:', error);

  // Send to error tracking service
  trackError(error);
}
```

### 3. Testing Strategy
```javascript
// Environment-specific configuration
const config = {
  development: {
    liffId: process.env.DEV_LIFF_ID,
    debugMode: true,
    mockMode: true
  },
  staging: {
    liffId: process.env.STAGING_LIFF_ID,
    debugMode: true,
    mockMode: false
  },
  production: {
    liffId: process.env.PROD_LIFF_ID,
    debugMode: false,
    mockMode: false
  }
};
```

### 4. User Experience
- Show loading states during LIFF init
- Provide fallbacks for unavailable APIs
- Handle offline scenarios gracefully
- Test on real devices, not just emulators

### 5. Security Considerations
- Validate LIFF ID token on backend
- Don't trust client-side user data
- Use HTTPS always
- Implement rate limiting
- Sanitize user inputs

## Quick Reference

### Common LIFF Methods
```javascript
// Initialize
await liff.init({ liffId });

// Check environment
liff.isInClient();        // In LINE app?
liff.isLoggedIn();       // User logged in?
liff.getOS();           // ios/android/web
liff.getVersion();      // LIFF version

// User actions
liff.login();           // Login
liff.logout();          // Logout
await liff.getProfile(); // Get profile

// LIFF actions
liff.closeWindow();     // Close LIFF
liff.openWindow({ url }); // Open URL
await liff.shareTargetPicker(messages); // Share
```

### Testing Workflow
1. **Local Development** → ngrok + Chrome DevTools
2. **Staging** → LIFF URL in LINE app
3. **Production** → Monitor with error tracking

### Troubleshooting Checklist
- [ ] LIFF ID is correct
- [ ] Domain is whitelisted
- [ ] Using HTTPS
- [ ] User is logged in (for profile APIs)
- [ ] Testing in actual LINE app
- [ ] Checking browser console for errors
- [ ] Network requests succeeding
- [ ] Correct LIFF size configured