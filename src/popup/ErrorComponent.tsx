const ErrorComponent = ({ message }: { message?: string }) => {
    if (!message) return null;
    return <div className="error">{message}</div>;
};

export default ErrorComponent;
