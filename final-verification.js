// ConsPIndo - Final Deployment Verification Script
// Run this in browser console to verify all systems

console.log('🚀 ConsPIndo Final Verification Started');
console.log('=====================================');

// 1. Check All Required Files
const requiredFiles = [
  'index.html',
  'main.js', 
  'style.css',
  'firebase.json',
  '.firebaserc',
  'pi-app-config.json',
  'validation-key.txt'
];

async function checkRequiredFiles() {
  console.log('\n📁 Checking Required Files...');
  const results = {};
  
  for (const file of requiredFiles) {
    try {
      const response = await fetch(file);
      results[file] = response.ok;
      console.log(`${response.ok ? '✅' : '❌'} ${file}`);
    } catch (error) {
      results[file] = false;
      console.log(`❌ ${file} - Error: ${error.message}`);
    }
  }
  
  return results;
}

// 2. Validate Pi Network Integration
function validatePiIntegration() {
  console.log('\n🥧 Validating Pi Network Integration...');
  
  const checks = {
    sdkLoaded: typeof window.Pi !== 'undefined',
    authFunction: typeof window.Pi?.authenticate === 'function',
    paymentFunction: typeof window.Pi?.createPayment === 'function',
    initFunction: typeof window.Pi?.init === 'function'
  };
  
  console.log(`${checks.sdkLoaded ? '✅' : '❌'} Pi SDK Loaded`);
  console.log(`${checks.authFunction ? '✅' : '❌'} Authentication Available`);
  console.log(`${checks.paymentFunction ? '✅' : '❌'} Payments Available`);
  console.log(`${checks.initFunction ? '✅' : '❌'} Initialization Available`);
  
  return checks;
}

// 3. Validate Firebase Integration
function validateFirebaseIntegration() {
  console.log('\n🔥 Validating Firebase Integration...');
  
  const checks = {
    sdkLoaded: typeof firebase !== 'undefined',
    appInitialized: firebase?.apps?.length > 0,
    authAvailable: typeof firebase?.auth === 'function',
    firestoreAvailable: typeof firebase?.firestore === 'function',
    storageAvailable: typeof firebase?.storage === 'function'
  };
  
  console.log(`${checks.sdkLoaded ? '✅' : '❌'} Firebase SDK Loaded`);
  console.log(`${checks.appInitialized ? '✅' : '❌'} Firebase App Initialized`);
  console.log(`${checks.authAvailable ? '✅' : '❌'} Firebase Auth Available`);
  console.log(`${checks.firestoreAvailable ? '✅' : '❌'} Firestore Available`);
  console.log(`${checks.storageAvailable ? '✅' : '❌'} Storage Available`);
  
  return checks;
}

// 4. Check Security Configuration
function validateSecurity() {
  console.log('\n🔒 Validating Security Configuration...');
  
  const checks = {
    https: location.protocol === 'https:' || location.hostname === 'localhost',
    csp: document.querySelector('meta[http-equiv="Content-Security-Policy"]') !== null,
    frameOptions: document.querySelector('meta[http-equiv="X-Frame-Options"]') !== null,
    contentType: document.querySelector('meta[http-equiv="X-Content-Type-Options"]') !== null
  };
  
  console.log(`${checks.https ? '✅' : '❌'} HTTPS Enabled`);
  console.log(`${checks.csp ? '✅' : '❌'} Content Security Policy`);
  console.log(`${checks.frameOptions ? '✅' : '❌'} X-Frame-Options`);
  console.log(`${checks.contentType ? '✅' : '❌'} X-Content-Type-Options`);
  
  return checks;
}

// 5. Check App Functionality
function validateAppFunctionality() {
  console.log('\n⚙️ Validating App Functionality...');
  
  const checks = {
    tabMenu: document.querySelector('.tab-menu') !== null,
    bottomNav: document.querySelector('.bottom-nav') !== null,
    loginMenu: document.getElementById('loginMenu') !== null,
    pageContent: document.getElementById('pageContent') !== null,
    adminPanel: typeof showAdminPanel === 'function',
    shopModule: typeof renderShopProducts === 'function',
    authModule: typeof loginUser === 'function'
  };
  
  console.log(`${checks.tabMenu ? '✅' : '❌'} Tab Navigation`);
  console.log(`${checks.bottomNav ? '✅' : '❌'} Bottom Navigation`);
  console.log(`${checks.loginMenu ? '✅' : '❌'} Login Menu`);
  console.log(`${checks.pageContent ? '✅' : '❌'} Page Content Container`);
  console.log(`${checks.adminPanel ? '✅' : '❌'} Admin Panel Function`);
  console.log(`${checks.shopModule ? '✅' : '❌'} Shop Module`);
  console.log(`${checks.authModule ? '✅' : '❌'} Authentication Module`);
  
  return checks;
}

// 6. Environment Detection
function detectEnvironment() {
  console.log('\n🌐 Environment Detection...');
  
  const env = {
    isPiBrowser: navigator.userAgent.includes('PiBrowser'),
    isMobile: /Mobi|Android/i.test(navigator.userAgent),
    isLocalhost: location.hostname === 'localhost',
    isProduction: location.hostname.includes('web.app') || location.hostname.includes('firebaseapp.com'),
    browserName: getBrowserName(),
    screenSize: `${screen.width}x${screen.height}`
  };
  
  console.log(`Browser: ${env.browserName}`);
  console.log(`${env.isPiBrowser ? '✅' : '❌'} Pi Browser`);
  console.log(`${env.isMobile ? '📱' : '💻'} ${env.isMobile ? 'Mobile' : 'Desktop'} Device`);
  console.log(`Environment: ${env.isProduction ? 'Production' : env.isLocalhost ? 'Local' : 'Unknown'}`);
  console.log(`Screen: ${env.screenSize}`);
  
  return env;
}

function getBrowserName() {
  const agent = navigator.userAgent;
  if (agent.includes('PiBrowser')) return 'Pi Browser';
  if (agent.includes('Chrome')) return 'Chrome';
  if (agent.includes('Firefox')) return 'Firefox';
  if (agent.includes('Safari')) return 'Safari';
  if (agent.includes('Edge')) return 'Edge';
  return 'Unknown';
}

// 7. Generate Deployment Report
async function generateDeploymentReport() {
  console.log('\n📊 Generating Deployment Report...');
}
  const report = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    environment: detectEnvironment(),
    files: await checkRequiredFiles(),
    piNetwork: validatePiIntegration(),
    firebase: validateFirebaseIntegration(),
    security: validateSecurity(),
    functionality: validateAppFunctionality(),
    recommendations: []
  };
  
  // Generate recommendations
  if (!report.security.https && !report.environment.isLocalhost) {\n    report.recommendations.push('⚠️ Deploy with HTTPS for production');\n  }\n  \n  if (!report.piNetwork.sdkLoaded) {\n    report.recommendations.push('⚠️ Pi SDK not loaded - Use Pi Browser for testing');\n  }\n  \n  if (!report.firebase.appInitialized) {\n    report.recommendations.push('⚠️ Firebase not initialized - Check configuration');\n  }\n  \n  const allFilesPresent = Object.values(report.files).every(Boolean);\n  if (!allFilesPresent) {\n    report.recommendations.push('⚠️ Some required files are missing');\n  }\n  \n  const piReady = report.piNetwork.sdkLoaded && report.piNetwork.authFunction;\n  const firebaseReady = report.firebase.sdkLoaded && report.firebase.appInitialized;\n  const securityReady = report.security.https;\n  \n  report.overallStatus = piReady && firebaseReady && securityReady && allFilesPresent ? 'READY' : 'NEEDS_ATTENTION';\n  \n  console.log('\\n📋 DEPLOYMENT REPORT:');\n  console.log('====================');\n  console.log(`Status: ${report.overallStatus === 'READY' ? '✅ READY FOR DEPLOYMENT' : '⚠️ NEEDS ATTENTION'}`);\n  console.log(`Timestamp: ${report.timestamp}`);\n  console.log(`URL: ${report.url}`);\n  console.log(`Environment: ${report.environment.isPiBrowser ? 'Pi Browser' : report.environment.browserName}`);\n  \n  if (report.recommendations.length > 0) {\n    console.log('\\n📝 Recommendations:');\n    report.recommendations.forEach(rec => console.log(rec));\n  }\n  \n  console.log('\\n📋 Next Steps:');\n  if (report.overallStatus === 'READY') {\n    console.log('✅ All systems ready!');\n    console.log('🚀 Deploy with: firebase deploy --only hosting');\n    console.log('🥧 Register in Pi Developer Portal');\n    console.log('📱 Test in Pi Browser after deployment');\n  } else {\n    console.log('⚠️ Fix issues above before deployment');\n    console.log('🔧 Run this verification again after fixes');\n  }\n  \n  return report;\n}\n\n// 8. Quick Test Functions\nwindow.ConsPIndoTesting = {\n  // Quick validations\n  checkFiles: checkRequiredFiles,\n  checkPi: validatePiIntegration,\n  checkFirebase: validateFirebaseIntegration,\n  checkSecurity: validateSecurity,\n  checkApp: validateAppFunctionality,\n  \n  // Full report\n  fullReport: generateDeploymentReport,\n  \n  // Quick tests\n  testPiLogin: () => {\n    if (typeof window.piLogin === 'function') {\n      console.log('🧪 Testing Pi Login...');\n      window.piLogin();\n    } else {\n      console.log('❌ Pi Login function not found');\n    }\n  },\n  \n  testFirestore: async () => {\n    try {\n      console.log('🧪 Testing Firestore connection...');\n      const db = firebase.firestore();\n      await db.collection('test').limit(1).get();\n      console.log('✅ Firestore connection successful');\n    } catch (error) {\n      console.log('❌ Firestore connection failed:', error.message);\n    }\n  }\n};\n\n// Auto-run verification\nconsole.log('🎯 ConsPIndo Testing Suite Ready!');\nconsole.log('📝 Run ConsPIndoTesting.fullReport() for complete verification');\nconsole.log('⚡ Run individual tests: ConsPIndoTesting.checkPi(), etc.');\n\n// Auto-generate report if in Pi Browser\nif (navigator.userAgent.includes('PiBrowser')) {\n  setTimeout(() => {\n    console.log('🥧 Pi Browser detected - Running auto-verification...');\n    generateDeploymentReport();\n  }, 3000);\n}"