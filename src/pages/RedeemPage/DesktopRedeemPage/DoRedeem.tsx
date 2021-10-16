import React from "react";
import { PickRedeem } from "pages/RedeemPage/MobileRedeemPage/PickRedeem";
import { Container, Grid, Text, Button } from "theme-ui";
import { GrayBox } from "components/GrayBox";
import { useTranslation } from "react-i18next";
import { SummaryTable } from "components/SummaryTable";
import { PoofAccountGlobal } from "hooks/poofAccount";
import { PoofKitGlobal } from "hooks/usePoofKit";
import { humanFriendlyNumber } from "utils/number";
import { RelayerOption } from "hooks/useRelayer";
import { getMinerEvents } from "utils/getMinerEvents";

interface IProps {
  onRedeemClick: () => void;
  setAmount: (amount: string) => void;
  amount: string;
  poofAmount: string;
  setRecipient: (recipient: string) => void;
  recipient: string;
  setTxHash: (txHash: string) => void;
  selectedRelayer?: RelayerOption;
  setSelectedRelayer: (relayer?: RelayerOption) => void;
  relayerOptions?: Array<RelayerOption>;
  usingCustomRelayer: boolean;
  setUsingCustomRelayer: (usingCustomRelayer: boolean) => void;
  customRelayer?: RelayerOption;
  setCustomRelayer: (relayerOption?: RelayerOption) => void;
  relayerFee: string;
}

export const DoRedeem: React.FC<IProps> = ({
  onRedeemClick,
  setAmount,
  amount,
  poofAmount,
  setRecipient,
  recipient,
  setTxHash,
  selectedRelayer,
  setSelectedRelayer,
  relayerOptions,
  usingCustomRelayer,
  setUsingCustomRelayer,
  customRelayer,
  setCustomRelayer,
  relayerFee,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = React.useState(false);
  const { actWithPoofAccount } = PoofAccountGlobal.useContainer();
  const { poofKit, poofKitLoading } = PoofKitGlobal.useContainer();
  const [privateKey, setPrivateKey] = React.useState<string>();
  const [redeemingAmt, setRedeemingAt] = React.useState(0);

  const unlockAccount = () =>
    actWithPoofAccount(
      async (pk) => {
        setPrivateKey(pk);
      },
      () => null
    );

  const handleRedeem = async () => {
    if (!selectedRelayer) {
      alert("Relayer is undefined");
      return;
    }
    if (poofKitLoading) {
      alert("Poof kit is still loading");
      return;
    }

    setLoading(true);
    try {
      const accountEvents = await getMinerEvents("NewAccount", poofKit);
      const apBalance = await poofKit?.apBalance(
        privateKey ?? "",
        accountEvents
      );
      const balance = Number(apBalance || 0);
      // Fee + a 0.001 wiggle
      const fee = Number(selectedRelayer?.miningServiceFee || 0) + 0.001;
      const max = Math.floor(balance * (1 - fee / 100));
      setRedeemingAt(max);
      const txHash = await poofKit?.swap(
        privateKey ?? "",
        max.toString(),
        recipient,
        selectedRelayer.url,
        accountEvents
      );
      if (txHash) {
        console.log(txHash);
        return max;
        //onRedeemClick();
      } else {
        console.error(
          "No response from relayer. Check your account in the explorer or try again"
        );
      }
    } catch (e) {
      if (e.response) {
        console.error(e.response.data.error);
      } else {
        console.debug(e);
      }
    }
    return 1;
  };

  const doRedeem = async () => {
    let success = true;
    setLoading(true);
    while (success) {
      success = ((await handleRedeem()) || 1) > 0;
    }
    setLoading(false);
  };

  let boxContent = (
    <>
      <Text sx={{ mb: 4 }} variant="subtitle">
        {t("redeem.desktop.specify.title")}
      </Text>
      <br />
      <Text variant="regularGray">{t("redeem.desktop.specify.subtitle")}</Text>
    </>
  );
  if (Number(amount) > 0) {
    boxContent = (
      <>
        <Text sx={{ mb: 4 }} variant="subtitle">
          {t("redeem.desktop.review.title")}
        </Text>
        <br />
        <SummaryTable
          title="Summary"
          lineItems={[
            {
              label: "AP",
              value: `${Number(amount).toLocaleString()} AP`,
            },
            {
              label: `Relayer Fee`,
              value: `${Number(relayerFee).toLocaleString()} AP`,
            },
          ]}
          totalItem={{
            label: "Total",
            value: `${humanFriendlyNumber(poofAmount)} POOF`,
          }}
        />
      </>
    );
  }

  return (
    <Grid sx={{ gridTemplateColumns: "1.3fr 1fr", gridGap: 6 }}>
      <Container>
        <Text sx={{ display: "block" }} variant="title">
          {t("redeem.desktop.title")}
        </Text>
        <Text sx={{ display: "block", mb: 4 }} variant="regularGray">
          {t("redeem.desktop.subtitle")}
        </Text>
        {privateKey ? (
          <Button onClick={doRedeem} disabled={loading}>
            Redeem
          </Button>
        ) : (
          <Button onClick={unlockAccount} disabled={loading}>
            {" "}
            Unlock Account{" "}
          </Button>
        )}
        {loading && (
          <Text sx={{ display: "block", mb: 4 }} variant="regularGray">
            Redeeming {redeemingAmt} AP!
          </Text>
        )}
      </Container>
      <Container>
        <GrayBox>{boxContent}</GrayBox>
      </Container>
    </Grid>
  );
};
