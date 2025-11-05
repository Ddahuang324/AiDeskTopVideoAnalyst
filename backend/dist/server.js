"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const analysisRoutes_1 = __importDefault(require("./routes/analysisRoutes"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// API Routes
app.use('/api/analysis', analysisRoutes_1.default);
// A simple test route
app.get('/', (req, res) => {
    res.send('AI Desktop Analysis Tool Backend is running!');
});
app.listen(port, () => {
    console.log(`Backend server is listening on http://localhost:${port}`);
});
