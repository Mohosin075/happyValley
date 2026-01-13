"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const http_status_codes_1 = require("http-status-codes");
const path_1 = __importDefault(require("path"));
const express_session_1 = __importDefault(require("express-session"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const passport_1 = __importDefault(require("./app/modules/auth/passport.auth/config/passport"));
const routes_1 = __importDefault(require("./routes"));
const morgan_1 = require("./shared/morgan");
const globalErrorHandler_1 = __importDefault(require("./app/middleware/globalErrorHandler"));
const handleStripeWebhook_1 = __importDefault(require("./stripe/handleStripeWebhook"));
const config_1 = __importDefault(require("./config"));
const app = (0, express_1.default)();
// -------------------- Stripe Webhook --------------------
app.use('/webhook', express_1.default.raw({ type: 'application/json' }), handleStripeWebhook_1.default);
// -------------------- Middleware --------------------
// Session must come before passport
app.use((0, express_session_1.default)({
    secret: config_1.default.jwt.jwt_secret || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // true if using HTTPS
}));
// Initialize Passport
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
// CORS
app.use((0, cors_1.default)({
    origin: [
        '*',
        'https://happyvalleyconcierge.com',
        'http://10.10.7.45:3000',
        'http://10.10.7.11:5173',
        'http://localhost:60851',
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:3001',
    ],
    credentials: true,
}));
// Body parser
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Cookie parser
app.use((0, cookie_parser_1.default)());
// Morgan logging
app.use(morgan_1.Morgan.successHandler);
app.use(morgan_1.Morgan.errorHandler);
// -------------------- Static Files --------------------
app.use(express_1.default.static('uploads'));
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
// -------------------- API Routes --------------------
app.use('/api/v1', routes_1.default);
// -------------------- Privacy Policy --------------------
app.get('/privacy-policy', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, 'privacy-policy.html'));
});
// -------------------- Root / Live Response --------------------
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ConciergeHub | Personalized Home Management Services</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    </head>
    <body style="
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
      color: #ffffff;
      min-height: 100vh;
      overflow-x: hidden;
    ">
      <div style="
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        padding: 2rem;
        position: relative;
      ">
        <!-- Background elements -->
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 20% 30%, rgba(120, 119, 198, 0.15) 0%, transparent 50%),
                      radial-gradient(circle at 80% 70%, rgba(100, 102, 204, 0.1) 0%, transparent 50%);
          z-index: 0;
        "></div>
        
        <div style="
          max-width: 1200px;
          width: 100%;
          position: relative;
          z-index: 1;
          text-align: center;
        ">
          <!-- Header -->
          <div style="margin-bottom: 3rem;">
            <div style="
              display: inline-flex;
              align-items: center;
              gap: 1rem;
              background: rgba(255, 255, 255, 0.1);
              backdrop-filter: blur(10px);
              padding: 0.75rem 1.5rem;
              border-radius: 50px;
              border: 1px solid rgba(255, 255, 255, 0.2);
              margin-bottom: 2rem;
            ">
              <i class="fas fa-crown" style="color: #ffd700; font-size: 1.2rem;"></i>
              <span style="font-weight: 600; letter-spacing: 0.5px;">CONCIERGEHUB API SERVER</span>
            </div>
            
            <h1 style="
              font-size: 3.5rem;
              font-weight: 800;
              margin: 0 0 1rem 0;
              background: linear-gradient(90deg, #00dbde 0%, #fc00ff 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              line-height: 1.1;
            ">
              Welcome to ConciergeHub
            </h1>
            <p style="
              font-size: 1.3rem;
              color: #b8b8ff;
              max-width: 700px;
              margin: 0 auto 2rem;
              line-height: 1.6;
            ">
              Premium Concierge Services for Modern Homeowners
            </p>
          </div>
          
          <!-- Main Content -->
          <div style="
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin-bottom: 3rem;
          ">
            <!-- Service Overview Card -->
            <div style="
              background: rgba(255, 255, 255, 0.05);
              border-radius: 20px;
              padding: 2rem;
              border: 1px solid rgba(255, 255, 255, 0.1);
              backdrop-filter: blur(10px);
              text-align: left;
              transition: transform 0.3s ease;
            " onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
              <div style="
                display: flex;
                align-items: center;
                gap: 1rem;
                margin-bottom: 1.5rem;
              ">
                <div style="
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  width: 50px;
                  height: 50px;
                  border-radius: 12px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                ">
                  <i class="fas fa-home" style="font-size: 1.5rem;"></i>
                </div>
                <h3 style="margin: 0; font-size: 1.5rem;">Service Overview</h3>
              </div>
              <p style="color: #cfcff9; line-height: 1.7; margin: 0;">
                ConciergeHub offers personalized concierge services for homeowners. 
                Schedule services, select your concierge representative, and interact 
                with our AI for grocery shopping. Secure payments via Stripe.
              </p>
            </div>
            
            <!-- Features Card -->
            <div style="
              background: rgba(255, 255, 255, 0.05);
              border-radius: 20px;
              padding: 2rem;
              border: 1px solid rgba(255, 255, 255, 0.1);
              backdrop-filter: blur(10px);
              text-align: left;
              transition: transform 0.3s ease;
            " onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
              <div style="
                display: flex;
                align-items: center;
                gap: 1rem;
                margin-bottom: 1.5rem;
              ">
                <div style="
                  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                  width: 50px;
                  height: 50px;
                  border-radius: 12px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                ">
                  <i class="fas fa-star" style="font-size: 1.5rem;"></i>
                </div>
                <h3 style="margin: 0; font-size: 1.5rem;">Key Features</h3>
              </div>
              <ul style="color: #cfcff9; line-height: 1.7; margin: 0; padding-left: 1.2rem;">
                <li style="margin-bottom: 0.5rem;">Subscription & à la carte services</li>
                <li style="margin-bottom: 0.5rem;">AI-powered grocery refinement</li>
                <li style="margin-bottom: 0.5rem;">Admin panel for service management</li>
                <li>Secure payment processing</li>
              </ul>
            </div>
            
            <!-- Services Card -->
            <div style="
              background: rgba(255, 255, 255, 0.05);
              border-radius: 20px;
              padding: 2rem;
              border: 1px solid rgba(255, 255, 255, 0.1);
              backdrop-filter: blur(10px);
              text-align: left;
              transition: transform 0.3s ease;
            " onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
              <div style="
                display: flex;
                align-items: center;
                gap: 1rem;
                margin-bottom: 1.5rem;
              ">
                <div style="
                  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                  width: 50px;
                  height: 50px;
                  border-radius: 12px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                ">
                  <i class="fas fa-concierge-bell" style="font-size: 1.5rem;"></i>
                </div>
                <h3 style="margin: 0; font-size: 1.5rem;">Our Services</h3>
              </div>
              <div style="display: flex; flex-wrap: wrap; gap: 0.75rem;">
                <span style="background: rgba(0, 219, 222, 0.2); color: #00dbde; padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.9rem;">Cleaning</span>
                <span style="background: rgba(252, 0, 255, 0.2); color: #fc00ff; padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.9rem;">Snow Removal</span>
                <span style="background: rgba(102, 126, 234, 0.2); color: #667eea; padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.9rem;">Grocery Shopping</span>
                <span style="background: rgba(245, 87, 108, 0.2); color: #f5576c; padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.9rem;">Home Management</span>
              </div>
            </div>
          </div>
          
          <!-- API Status -->
          <div style="
            background: rgba(0, 0, 0, 0.2);
            border-radius: 15px;
            padding: 2rem;
            margin-bottom: 2rem;
            border-left: 4px solid #00dbde;
          ">
            <div style="display: flex; align-items: center; justify-content: center; gap: 1rem; margin-bottom: 1rem;">
              <div style="
                width: 12px;
                height: 12px;
                background: #00ff88;
                border-radius: 50%;
                animation: pulse 2s infinite;
              "></div>
              <p style="margin: 0; font-size: 1.1rem; font-weight: 500;">
                API Server is running successfully
              </p>
            </div>
            <p style="color: #aaa; margin: 0; max-width: 600px; margin: 0 auto;">
              This is the backend server for ConciergeHub platform. 
              Please refer to the API documentation for available endpoints.
              <br>
              Base route <code style="background: rgba(0, 219, 222, 0.2); color: #00dbde; padding: 0.2rem 0.5rem; border-radius: 4px; font-family: 'JetBrains Mono', monospace;">'/'</code> is not intended for direct access.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="
            padding-top: 2rem;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
          ">
            <p style="color: #888; margin: 0 0 0.5rem 0;">
              Simplifying home management for modern homeowners
            </p>
            <p style="color: #666; margin: 0; font-size: 0.9rem;">
              © ${new Date().getFullYear()} ConciergeHub — All rights reserved.
            </p>
          </div>
        </div>
      </div>
      
      <style>
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        
        @media (max-width: 768px) {
          body > div {
            padding: 1rem;
          }
          
          h1 {
            font-size: 2.5rem !important;
          }
          
          .grid-container {
            grid-template-columns: 1fr !important;
          }
        }
      </style>
    </body>
    </html>
  `);
});
// -------------------- Global Error Handler --------------------
app.use(globalErrorHandler_1.default);
// -------------------- 404 Handler --------------------
app.use((req, res) => {
    res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Lost, are we?',
        errorMessages: [
            {
                path: req.originalUrl,
                message: "Congratulations, you've reached a completely useless API endpoint 👏",
            },
            {
                path: '/docs',
                message: 'Hint: Maybe try reading the docs next time? 📚',
            },
        ],
        roast: '404 brain cells not found. Try harder. 🧠❌',
        timestamp: new Date().toISOString(),
    });
});
exports.default = app;
