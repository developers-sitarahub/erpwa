import type React from "react"

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> { }

export function Checkbox({ className = "", ...props }: CheckboxProps) {
  return (
    <div className={`checkbox-wrapper ${className}`}>
      <label className="checkbox-container relative block pl-[35px] mb-[12px] cursor-pointer text-[16px] select-none">
        <input
          type="checkbox"
          className="custom-checkbox absolute opacity-0 cursor-pointer h-0 w-0"
          {...props}
        />
        <span className="checkmark absolute top-0 left-0 h-[25px] w-[25px] bg-[#eee] rounded-[4px] transition-colors duration-300 shadow-[0_2px_5px_rgba(0,0,0,0.2)]" />
      </label>
      <style jsx>{`
        .checkbox-wrapper .checkmark:after {
          content: "";
          position: absolute;
          display: none;
          left: 9px;
          top: 5px;
          width: 5px;
          height: 10px;
          border: solid white;
          border-width: 0 3px 3px 0;
          transform: rotate(45deg);
        }

        .checkbox-wrapper input:checked ~ .checkmark {
          background-color: #2196F3;
          box-shadow: 0 3px 7px rgba(33, 150, 243, 0.3);
        }

        .checkbox-wrapper input:checked ~ .checkmark:after {
          display: block;
          animation: checkAnim 0.2s forwards;
        }

        @keyframes checkAnim {
          0% {
            height: 0;
          }
          100% {
            height: 10px;
          }
        }
      `}</style>
    </div>
  )
}
