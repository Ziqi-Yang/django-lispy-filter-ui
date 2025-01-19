/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./demo/index.html",
        "./demo/main.ts",
        "./demo/tailwind.css"
    ],
    theme: {
        extend: {},
    },
    plugins: [
        require('daisyui'),
    ],
}

