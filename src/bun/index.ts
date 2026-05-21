import { BrowserWindow, BrowserView, Updater } from "electrobun/bun";
import { type AppRPCType } from "../shared/types"; // Vérifie bien ce chemin relatif

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

const fib = (n: number): number => (n <= 1 ? n : fib(n - 1) + fib(n - 2));

// Déclaration de l'RPC avec le type explicite pour corriger l'erreur de type implicite 'any'
const myAppRPC = BrowserView.defineRPC<AppRPCType>({
    maxRequestTime: 5000,
    handlers: {
        requests: {
            calculateFibonacci: ({ n }) => {
                console.log(`Calcul de Fibonacci (RPC) pour n = ${n}`);
                const result = fib(n);
                return { n, result };
            },
        },
        messages: {},
    },
});

async function getMainViewUrl(): Promise<string> {
    const channel = await Updater.localInfo.channel();
    if (channel === "dev") {
        try {
            await fetch(DEV_SERVER_URL, { method: "HEAD" });
            return DEV_SERVER_URL;
        } catch {
            console.log("Vite dev server not running.");
        }
    }
    return "views://mainview/index.html";
}

const url = await getMainViewUrl();

const mainWindow = new BrowserWindow({
    title: "React + Tailwind + Vite",
    url,
    rpc: myAppRPC,
    frame: {
        width: 900,
        height: 700,
        x: 200,
        y: 200,
    },
});

// Petite astuce pour enlever le warning "mainWindow declared but never read"
mainWindow.setTitle("Calculateur Fibonacci Ultra Fast");