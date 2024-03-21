import type {
    IMessage,
    IPopupMessage,
    IResponse,
    ISettingsUpdateMessage,
    ITabData,
} from '../interfaces';
import { useEffect, useState, useRef } from 'react';
import logo from '/logo.svg';
import settings from '/settings.svg';
import './App.css';
import {
    TOGGLE_RUNNING_STATE,
    POPUP_SIGNAL,
    isWorkerMessage,
    EXTENSION_HEADER,
    RESET_BUTTON_TEXT,
} from './constants';
import { LocalStorageWrapper } from '../LocalStorageWrapper';
import TabCardList from './TabCardList';
import ErrorComponent from './ErrorComponent';
import RunningAnimation from './RunningAnimation';
import SettingsModal from './SettingsModal';
import { useAppContext } from './AppContext';

const App = () => {
    const [running, setRunning] = useState(false);
    const [tabs, setTabs] = useState<ITabData[]>([]);
    const [errorMessage, setErrorMessage] = useState<string>();
    const [settingsVisible, setSettingsVisible] = useState<boolean>(false);
    const isFirstMount = useRef(true);

    const { developerMode, maxTabs, setDeveloperMode, setMaxTabs } =
        useAppContext();

    useEffect(() => {
        initializeUI();
        const handleMessage = (message: IMessage) => {
            if (isWorkerMessage(message) && message.signal === 'refresh') {
                refreshUI();
            }
        };

        chrome.runtime.onMessage.addListener(handleMessage);
        return () => chrome.runtime.onMessage.removeListener(handleMessage);
    }, []);

    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            return;
        }

        const message: ISettingsUpdateMessage = {
            source: 'Popup',
            signal: 'update_settings',
            payload: {
                devMode: developerMode,
                maxTabs,
            },
        };

        const updateSettings = async () => {
            await LocalStorageWrapper.set('devMode', developerMode);
            await LocalStorageWrapper.set('maxTabs', maxTabs);
            chrome.runtime.sendMessage(message);
        };

        updateSettings();
    }, [developerMode, maxTabs]);

    const initializeUI = async () => {
        const storedTabs = await LocalStorageWrapper.get('tabs');
        const storedRunningStatus = await LocalStorageWrapper.get('isRunning');
        const storedDevMode = await LocalStorageWrapper.get('devMode');
        const storedMaxTabs = await LocalStorageWrapper.get('maxTabs');
        if (storedTabs) setTabs(storedTabs);
        if (storedRunningStatus) setRunning(storedRunningStatus);
        if (storedDevMode) setDeveloperMode(storedDevMode);
        if (storedMaxTabs) setMaxTabs(storedMaxTabs);
    };

    const refreshUI = () => {
        LocalStorageWrapper.get('tabs').then((tabs) => {
            setTabs(tabs || []);
        });
    };

    const toggleSettingsVisibility = () => {
        setSettingsVisible((prevState) => !prevState);
    };

    const toggleScraping = async () => {
        const runningStatus = running ? POPUP_SIGNAL.STOP : POPUP_SIGNAL.START;
        const message: IPopupMessage = {
            source: 'Popup',
            signal: runningStatus,
        };
        const newRunningStatus = !running;
        await LocalStorageWrapper.set('isRunning', !running);
        setRunning((prevRunningState) => !prevRunningState);
        chrome.runtime.sendMessage(message, (response: IResponse) => {
            if (!response.success) {
                LocalStorageWrapper.set('isRunning', !newRunningStatus);
                setRunning((prevRunningState) => !prevRunningState);
                setErrorMessage(response.message);
            }
        });
    };

    const reset = async () => {
        LocalStorageWrapper.clear();
        const message: IPopupMessage = {
            source: 'Popup',
            signal: 'restart',
        };
        chrome.runtime.sendMessage(message);
        refreshUI();
    };

    return (
        <>
            <div
                className="settings-container"
                onClick={toggleSettingsVisibility}
            >
                <img src={settings} className="settings-icon" alt="settings" />
            </div>
            {settingsVisible && (
                <>
                    <div
                        className="settings-modal-overlay"
                        onClick={toggleSettingsVisibility}
                    ></div>
                    <SettingsModal />
                </>
            )}
            <img src={logo} className="logo" alt="logo" />
            <h2>{EXTENSION_HEADER}</h2>
            <div className="buttons">
                <button onClick={toggleScraping}>
                    {running
                        ? TOGGLE_RUNNING_STATE.RUNNING
                        : TOGGLE_RUNNING_STATE.REST}
                </button>
                {running ? <RunningAnimation /> : null}
                {!running && tabs.length ? (
                    <button onClick={reset}>{RESET_BUTTON_TEXT}</button>
                ) : null}
            </div>

            <ErrorComponent message={errorMessage} />
            <TabCardList tabs={tabs} />
        </>
    );
};

export default App;
