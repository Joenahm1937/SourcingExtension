import './SettingsModal.css';
import { useAppContext } from './AppContext';

const MAX_TABS_LIMIT = 10;

const SettingsModal = () => {
    const { developerMode, setDeveloperMode, maxTabs, setMaxTabs } =
        useAppContext();

    return (
        <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Settings</h2>
            <div className="settings-content">
                <div className="setting">
                    <label htmlFor="developer-mode" className="switch">
                        <input
                            type="checkbox"
                            id="developer-mode"
                            checked={developerMode}
                            onChange={(e) => setDeveloperMode(e.target.checked)}
                        />
                        <span className="slider round"></span>
                    </label>
                    <span>Developer Mode</span>
                </div>
                <div className="setting">
                    <label htmlFor="max-tabs">Max Tabs:</label>
                    <input
                        type="number"
                        id="max-tabs"
                        min="1"
                        max={MAX_TABS_LIMIT}
                        value={maxTabs}
                        onChange={(e) => {
                            const maxTabInput = parseInt(e.target.value);
                            if (
                                maxTabInput <= MAX_TABS_LIMIT &&
                                MAX_TABS_LIMIT >= 0
                            ) {
                                setMaxTabs(parseInt(e.target.value));
                            }
                        }}
                    />
                    {maxTabs > 5 && (
                        <small>
                            Warning: Setting more than 6 tabs may degrade
                            performance.
                        </small>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
