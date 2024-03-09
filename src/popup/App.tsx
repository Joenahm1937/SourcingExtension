import type {
    IMessage,
    IPopupMessage,
    IResponse,
    ITabData,
} from '../interfaces';
import { useEffect, useState } from 'react';
import logo from '/logo.svg';
import './App.css';
import {
    TOGGLE_RUNNING_STATE,
    POPUP_SIGNAL,
    isWorkerMessage,
    DOWNLOAD_BUTTON_TEXT,
    EXTENSION_HEADER,
    RESET_BUTTON_TEXT,
} from './constants';
import { LocalStorageWrapper } from '../LocalStorageWrapper';
import TabCardList from './TabCardList';
import ErrorComponent from './ErrorComponent';
import RunningAnimation from './RunningAnimation';
import DownloadingAnimation from './DownloadingAnimation';

const App = () => {
    const [running, setRunning] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [tabs, setTabs] = useState<ITabData[]>([]);
    const [errorMessage, setErrorMessage] = useState<string>();

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

    const initializeUI = async () => {
        const storedTabs = await LocalStorageWrapper.get('tabs');
        const storedRunningStatus = await LocalStorageWrapper.get('isRunning');
        if (storedTabs) setTabs(storedTabs);
        if (storedRunningStatus) setRunning(storedRunningStatus);
    };

    const refreshUI = () => {
        LocalStorageWrapper.get('tabs').then((tabs) => {
            setTabs(tabs || []);
        });
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

    const download = async () => {
        setDownloading(true);
        await new Promise((resolve) => setTimeout(resolve, 4000));
        setDownloading(false);
        reset();
    };

    return (
        <>
            <img src={logo} className="logo" alt="logo" />
            <h2>{EXTENSION_HEADER}</h2>
            <div className="buttons">
                {!downloading ? (
                    <button onClick={toggleScraping}>
                        {running
                            ? TOGGLE_RUNNING_STATE.RUNNING
                            : TOGGLE_RUNNING_STATE.REST}
                    </button>
                ) : null}
                {running ? <RunningAnimation /> : null}
                {!running && !downloading && tabs.length ? (
                    <>
                        <button onClick={reset}>{RESET_BUTTON_TEXT}</button>
                        <button onClick={download}>
                            {DOWNLOAD_BUTTON_TEXT}
                        </button>
                    </>
                ) : null}
            </div>

            {downloading ? <DownloadingAnimation /> : null}
            <ErrorComponent message={errorMessage} />
            <TabCardList tabs={tabs} />
        </>
    );
};

export default App;
