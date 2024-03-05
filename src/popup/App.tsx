import { useEffect, useState } from 'react';
import logo from '/logo.svg';
import './App.css';
import {
    BackgroundToPopupMessage,
    IPageData,
    PopupToBackgroundAction,
} from '../interfaces';
import { BUTTON_TEXT, INVALID_PAGE_ERROR } from './constants';
import PageList from './PageList';
import ErrorComponent from './ErrorComponent';

const App = () => {
    const [running, setRunning] = useState(false);
    const [pages, _] = useState<IPageData[]>([]);
    const [errorMessage, setErrorMessage] = useState<string>();

    useEffect(() => {
        // Listen for messages from the background script
        const handleMessage = (message: BackgroundToPopupMessage) => {
            if (message.action === 'updatePopup') {
                refreshPages();
            }
        };

        chrome.runtime.onMessage.addListener(handleMessage);
        return () => chrome.runtime.onMessage.removeListener(handleMessage);
    }, []);

    const refreshPages = () => {
        // setPages([...]); // Update based on storage data
    };

    const toggleScraping = () => {
        const action = running
            ? PopupToBackgroundAction.stopContentScript
            : PopupToBackgroundAction.startContentScript;
        chrome.runtime.sendMessage({ action }, (response) => {
            if (response && response.success) {
                setRunning(!running);
                setErrorMessage(undefined);
            } else {
                setErrorMessage(INVALID_PAGE_ERROR);
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
            <PageList pages={pages} />
        </>
    );
};

export default App;
