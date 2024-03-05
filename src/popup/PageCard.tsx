import { IPageData } from '../interfaces';

const PageCard = ({ profile }: IPageData) => (
    <li className="page-card">
        <div>{profile}</div>
    </li>
);

export default PageCard;
