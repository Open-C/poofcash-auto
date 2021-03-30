import { BLOCKSCOUT_URL } from "config";
import React from "react";

export const BlockscoutTxLink: React.FC<{ tx: string }> = ({
  tx,
  children,
}) => {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      href={`${BLOCKSCOUT_URL}/tx/${tx}`}
    >
      {children}
    </a>
  );
};

export const BlockscoutAddressLink: React.FC<{
  address: string;
}> = ({ address, children }) => {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      href={`${BLOCKSCOUT_URL}/address/${address}`}
    >
      {children}
    </a>
  );
};
