import { ICardData } from './interfaces';
import PageCard from './PageCard';

const PageList = ({ pages }: { pages: ICardData[] }) => (
    <ul className="pages">
        {pages.map((pageData) => (
            <PageCard key={pageData.profileURL} {...pageData} />
        ))}
    </ul>
);

export default PageList;
