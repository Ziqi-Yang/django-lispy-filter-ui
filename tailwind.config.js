/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "demo/main.ts",
        "demo/index.html",
        "demo/tailwind.css",
        "src/**/*.ts",
    ],
    theme: {
        extend: {},
    },
    plugins: [
        require('daisyui'),
    ],
}

