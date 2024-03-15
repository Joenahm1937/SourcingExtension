import type { ITabData } from '../interfaces';
import './TabCard.css';
import TabCard from './TabCard';

const TabCardList = ({ tabs }: { tabs: ITabData[] }) => (
    <ul className="tabs">
        {tabs.map((tab) => (
            <TabCard key={tab.url} {...tab} />
        ))}
    </ul>
);

export default TabCardList;
