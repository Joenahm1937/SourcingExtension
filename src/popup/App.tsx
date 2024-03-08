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
    RUNNING_STATE,
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
        const runningStatus = running
            ? RUNNING_STATE.STOP
            : RUNNING_STATE.START;
        const message: IPopupMessage = {
            source: 'Popup',
            signal: runningStatus,
        };
        await LocalStorageWrapper.set('isRunning', !running);
        setRunning(!running);
        chrome.runtime.sendMessage(message, (response: IResponse) => {
            if (response && response.success) {
                setErrorMessage(undefined);
            } else {
                setRunning(!running);
                setErrorMessage(response.message);
            }
        });
    };

    const reset = async () => {
        LocalStorageWrapper.clear();
        setTabs([]);
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
            <div className="header" />
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
                    <button onClick={download}>{DOWNLOAD_BUTTON_TEXT}</button>
                </>
            ) : null}

            {downloading ? <DownloadingAnimation /> : null}
            <ErrorComponent message={errorMessage} />
            <TabCardList tabs={tabs} />
        </>
    );
};

export default App;
