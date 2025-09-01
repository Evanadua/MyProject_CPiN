# ConsPIndo - Firebase Hosting & Pi Network Setup Guide

## 🚀 Firebase Hosting Configuration

### 1. Prerequisites
- Firebase CLI installed: `npm install -g firebase-tools`
- Firebase project: `meribuco-conspindo`
- Pi Network Developer Account

### 2. Firebase Hosting Setup Commands

```bash
# Login to Firebase
firebase login

# Initialize Firebase in your project (if not done)
firebase init hosting

# Select existing project: meribuco-conspindo
# Set public directory as current directory (.)
# Configure as single-page app: Yes
# Set up automatic builds and deploys with GitHub: No (optional)

# Deploy to Firebase Hosting
firebase deploy --only hosting

# View your deployed app
firebase hosting:open
```

### 3. Pi Network Developer Portal Configuration

#### App Information:
- **App Name**: ConsPIndo - Consortium Pioneers Indonesia  
- **Description**: Platform komunitas untuk Pi Network Indonesia yang menghubungkan pioneer dengan layanan bisnis, e-commerce, dan manajemen acara
- **Category**: Social & Business
- **App URL**: https://meribuco-conspindo.web.app
- **Icon URL**: https://raw.githubusercontent.com/Evanadua/MyProject_CPiN/refs/heads/main/logo.png

#### Technical Settings:
- **Pi SDK Version**: 2.0
- **Required Scopes**: username, payments
- **Sandbox Mode**: false (for production) / true (for testing)
- **Validation Key**: Use the content from validation-key.txt

#### App Verification:
1. Ensure your app is deployed and accessible via HTTPS
2. Verify Pi SDK is properly loaded
3. Test authentication flow in Pi Browser
4. Submit for Pi Network review

### 4. Domain Configuration

Your app will be available at:
- **Primary**: https://meribuco-conspindo.web.app
- **Secondary**: https://meribuco-conspindo.firebaseapp.com

### 5. Security Requirements

✅ HTTPS enforced
✅ Content Security Policy configured  
✅ Pi SDK v2.0 implemented
✅ Error handling for non-Pi browsers
✅ Proper authentication flow

### 6. Testing Checklist

Before submitting to Pi Network:

- [ ] App loads correctly in Pi Browser
- [ ] Pi authentication works without errors
- [ ] Payment integration functional (if applicable)
- [ ] All features work on mobile devices
- [ ] HTTPS certificate valid
- [ ] No console errors in Pi Browser

### 7. Troubleshooting

**Pi Login Issues:**
- Ensure using Pi Browser
- Check HTTPS is enabled
- Verify Pi SDK initialization
- Check network connectivity

**Hosting Issues:**
- Verify Firebase project settings
- Check deployment logs
- Ensure proper file permissions
- Validate firebase.json configuration

### 8. Support Contacts

- Firebase Support: https://firebase.google.com/support
- Pi Network Developer: https://develop.pi/
- App Support: support@conspindo.com

## 📋 Next Steps

1. Deploy your app using the commands above
2. Register your app in Pi Network Developer Portal
3. Submit for review and approval
4. Monitor app performance and user feedback

## 🔧 Maintenance

Regular tasks:
- Update Pi SDK when new versions available
- Monitor Firebase usage and billing
- Backup user data regularly
- Update security configurations as needed