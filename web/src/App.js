import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminDashboard from "@/components/AdminDashboard";
export default function App() {
    return (_jsx(BrowserRouter, { children: _jsx("div", { className: "min-h-screen bg-neutral-950 text-neutral-100", children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/admin", replace: true }) }), _jsx(Route, { path: "/admin", element: _jsx(AdminDashboard, {}) })] }) }) }));
}
