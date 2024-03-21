import type { ILog, ITabData } from '../interfaces';
import { useState } from 'react';

const TabCard = ({
    url,
    user,
    bioLinkUrls,
    followerCount,
    suggestedProfiles,
    profileImageUrl,
    logs,
}: ITabData) => {
    const [logsVisible, setLogsVisible] = useState(false);
    const [suggestionsVisible, setSuggestionsVisible] = useState(false);

    return (
        <li className="tab-card">
            <div>
                <div
                    className="tab-card-profile"
                    onClick={() => chrome.tabs.create({ active: true, url })}
                >
                    <img
                        crossOrigin="anonymous"
                        src={profileImageUrl}
                        className="tab-card-profile-image"
                    />
                    @{user}
                </div>
                <div>{followerCount}</div>
                <div>
                    {bioLinkUrls?.map((link) => (
                        <div>
                            <a
                                className="tab-card-link"
                                onClick={() =>
                                    chrome.tabs.create({
                                        active: true,
                                        url: `https://${link}`,
                                    })
                                }
                            >
                                {typeof link === 'string' && link.length >= 15
                                    ? `${link.substring(0, 15)}...`
                                    : link}
                            </a>
                        </div>
                    ))}
                </div>
                <div>
                    {suggestedProfiles ? (
                        <button
                            onClick={() =>
                                setSuggestionsVisible(
                                    (prevVisibility) => !prevVisibility
                                )
                            }
                        >
                            {suggestionsVisible
                                ? 'Hide Suggestions'
                                : 'Show Suggestions'}
                        </button>
                    ) : (
                        'No suggestions'
                    )}
                    {suggestionsVisible ? (
                        <div>
                            <h5>Suggested Profiles:</h5>
                            {suggestedProfiles?.map((suggestedProfile) => {
                                return (
                                    <div
                                        className="suggested-profile"
                                        onClick={() =>
                                            chrome.tabs.create({
                                                active: true,
                                                url: suggestedProfile,
                                            })
                                        }
                                    >
                                        {`@${getNameFromUrl(suggestedProfile)}`}
                                    </div>
                                );
                            })}
                        </div>
                    ) : null}
                </div>
                <div>
                    {logs ? (
                        <button
                            onClick={() =>
                                setLogsVisible(
                                    (prevVisibility) => !prevVisibility
                                )
                            }
                        >
                            {logsVisible ? 'Hide Logs' : 'Show Logs'}
                        </button>
                    ) : null}
                    {logsVisible ? (
                        <div>
                            {logs?.map((log: ILog) => {
                                let backgroundColorClass = '';
                                switch (log.severity) {
                                    case 'WARN':
                                        backgroundColorClass = 'log-warn';
                                        break;
                                    case 'ERROR':
                                        backgroundColorClass = 'log-error';
                                        break;
                                    case 'INFO':
                                    default:
                                        backgroundColorClass = 'log-info';
                                        break;
                                }
                                return (
                                    <div
                                        className={`log-card ${backgroundColorClass}`}
                                    >
                                        <div className="log-detail">
                                            <strong>Method:</strong>{' '}
                                            {log.methodName}
                                        </div>
                                        <div className="log-detail">
                                            <strong>Message:</strong>{' '}
                                            {log.message}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : null}
                </div>
            </div>
        </li>
    );
};

const getNameFromUrl = (url: string): string => {
    const match = url.match(/https:\/\/www\.instagram\.com\/(.+?)\//);
    return match ? match[1] : '';
};

export default TabCard;
