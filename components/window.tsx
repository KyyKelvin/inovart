import type{ReactNode}from"react";
export function Window({label,children,className=""}:{label:string;children:ReactNode;className?:string}){return <div className={`window ${className}`}><div className="window-bar"><span>{label}</span><span className="dots"><i/><i/><i/></span></div>{children}</div>}
