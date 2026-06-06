import logoUrl from "../assets/logo.png";

export const Updating = () => {
	return (
		<div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full">
			<div className="bg-mocha-surface0/60 backdrop-blur-md rounded-2xl border border-mocha-surface0 shadow-2xl p-8 md:p-12 max-w-sm w-full text-center flex flex-col items-center gap-6 relative z-10 transition-all duration-500 ease-in-out">
				{/* Spinner + Logo Wrapper */}
				<div className="relative w-20 h-20 flex items-center justify-center select-none">
					{/* Outer glowing pulsing ring */}
					<div className="absolute inset-0 rounded-full bg-mocha-mauve/10 animate-ping" />
					{/* Spinning gradient border */}
					<div className="absolute inset-0 rounded-full border-4 border-mocha-surface1" />
					<div className="absolute inset-0 rounded-full border-4 border-t-mocha-mauve border-r-mocha-pink border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '1.2s' }} />
					
					{/* Center logo */}
					<img 
						src={logoUrl} 
						alt="YAFW Logo" 
						className="w-10 h-10 object-contain relative z-10 rounded-md"
					/>
				</div>

				{/* Typography */}
				<div className="flex flex-col gap-2">
					<h2 className="text-xl font-black tracking-wide bg-gradient-to-r from-mocha-mauve via-mocha-pink to-mocha-blue bg-clip-text text-transparent">
						Updating YAFW
					</h2>
					<p className="text-xs text-mocha-subtext0 font-medium px-4 leading-relaxed">
						Please wait while we install the latest enhancements. This should only take a moment.
					</p>
				</div>
			</div>
		</div>
	);
};