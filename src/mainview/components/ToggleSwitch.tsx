interface ToggleSwitchProps {
	checked: boolean;
	onChange: () => void;
	disabled?: boolean;
}

export const ToggleSwitch = ({ checked, onChange, disabled }: ToggleSwitchProps) => (
	<button
		type="button"
		role="switch"
		aria-checked={checked}
		disabled={disabled}
		onClick={onChange}
		className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-mocha-mauve ${
			checked ? "bg-mocha-mauve" : "bg-mocha-surface2"
		} ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
	>
		<span
			className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-mocha-text shadow ring-0 transition duration-200 ease-in-out ${
				checked ? "translate-x-5" : "translate-x-0"
			}`}
		/>
	</button>
);
