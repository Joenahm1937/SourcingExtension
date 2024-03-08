import type {
    IMessage,
    IPopupMessage,
    IResponse,
    ITabData,
} from '../interfaces';
import { useEffect, useState } from 'react';
import logo from '/logo.svg';
import './App.css';
import { BUTTON_TEXT, POPUP_SIGNAL, isWorkerMessage } from './constants';
import TabCardList from './TabCardList';
import ErrorComponent from './ErrorComponent';
import { LocalStorageWrapper } from '../LocalStorageWrapper';

const App = () => {
    const [running, setRunning] = useState(false);
    const [tabs, setTabs] = useState<ITabData[]>([]);
    const [errorMessage, setErrorMessage] = useState<string>();

    useEffect(() => {
        const handleMessage = (message: IMessage) => {
            if (isWorkerMessage(message) && message.signal === 'refresh') {
                refreshPages();
            } else if (
                isWorkerMessage(message) &&
                message.signal === 'tab_failure'
            ) {
                setErrorMessage(message.message);
            }
        };

        chrome.runtime.onMessage.addListener(handleMessage);
        return () => chrome.runtime.onMessage.removeListener(handleMessage);
    }, []);

    const refreshPages = () => {
        LocalStorageWrapper.get('tabs').then((tabs) => {
            setTabs(tabs || []);
        });
    };

    const toggleScraping = () => {
        const signal = running ? POPUP_SIGNAL.STOP : POPUP_SIGNAL.START;
        const message: IPopupMessage = {
            source: 'Popup',
            signal,
        };
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

    return (
        <>
            <img src={logo} className="logo" alt="logo" />
            <h2>Sourcing Assistant</h2>
            <div className="header">
                <button onClick={toggleScraping}>
                    {running ? BUTTON_TEXT.RUNNING : BUTTON_TEXT.REST}
                </button>
            </div>
            {running ? <p>RUNNING . . .</p> : <button>DOWNLOAD</button>}
            <ErrorComponent message={errorMessage} />
            <TabCardList tabs={tabs} />
        </>
    );
};

export default App;
