import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CustomButton } from "../CustomButton";
import { faRobot, faThunderstorm } from "@fortawesome/free-solid-svg-icons";
import { faBrain } from "@fortawesome/free-solid-svg-icons/faBrain";

export const Header: React.FC<{
  briefingOpen: boolean;
  setBriefingOpen: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ briefingOpen, setBriefingOpen }) => {
  return (
    <header className="sticky top-0 z-30 bg-tech-black-950/95 border-b border-tech-black-600 py-6 px-4 md:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            IntelliTrends
          </h1>
          <p className="text-sm text-slate-400 ">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <CustomButton
          variant="primary"
          icon={<FontAwesomeIcon icon={faRobot} className="w-4 h-4" />}
          onClick={() => setBriefingOpen(true)}
        >
          Generate Brief
        </CustomButton>
      </div>
    </header>
  );
};
