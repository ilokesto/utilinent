export function createSwitchMatch(data) {
    function Switch({ children, when, fallback = null }) {
        children.reduce((acc, { type, props }) => {
            if (type !== Match)
                throw new Error("Match 컴포넌트만 사용할 수 있습니다.");
            if (props.case) {
                if (acc.includes(props.case))
                    throw new Error(`Duplicate Match key: ${props.case}`);
                else
                    acc.push(props.case);
            }
            return acc;
        }, []);
        return children.find(({ props }) => props.case === data[when]) ?? fallback;
    }
    function Match({ children }) {
        return children(data);
    }
    ;
    return { Switch, Match };
}
