import React, { useEffect, useState } from "react";
import { PickMine } from "pages/MinePage/MobileMinePage/PickMine";
import {
  Box,
  Container,
  Grid,
  Text,
  Textarea,
  Button,
  Spinner,
} from "theme-ui";
import { GrayBox } from "components/GrayBox";
import { useTranslation } from "react-i18next";
import { SummaryTable } from "components/SummaryTable";
import { PoofAccountGlobal } from "hooks/poofAccount";
import { PoofKitGlobal } from "hooks/usePoofKit";
import { RelayerOption } from "hooks/useRelayer";
import {
  DepositListGlobal,
  NoteList,
  NoteListMode,
} from "components/DepositList";
import { getPoofEvents } from "utils/getPoofEvents";
import { Note } from "@poofcash/poof-kit";
import { getMinerEvents } from "utils/getMinerEvents";
import { getTreeEvents } from "utils/getTreeEvents";

interface IProps {
  onMineClick: () => void;
  setNote: (note: string) => void;
  note: string;
  noteIsValid: boolean;
  estimatedAp: number;
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

export const DoMine: React.FC<IProps> = ({
  onMineClick,
  setNote,
  note,
  noteIsValid,
  estimatedAp,
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
  const { withdrawals } = DepositListGlobal.useContainer();

  const { t } = useTranslation();
  const [loading, setLoading] = React.useState(false);
  const [privateKey, setPrivateKey] = useState<string>();
  const { poofKit, poofKitLoading } = PoofKitGlobal.useContainer();

  const { actWithPoofAccount } = PoofAccountGlobal.useContainer();

  const totalMineAmount = Number(estimatedAp) - Number(relayerFee);

  const [toMine, setToMine] = useState("");
  const [left, setLeft] = useState(0);

  const getKey = () => {
    if (poofKitLoading) {
      alert("Poof kit is still initializing");
      return;
    }

    actWithPoofAccount(
      (pk) => setPrivateKey(pk),
      () => console.log("Denied :(")
    );
  };

  useEffect(() => {
    if (withdrawals && withdrawals.length > 0) {
      setToMine(withdrawals.map((w) => `${w.note.toNoteString()}`).join("\n"));
    }
  }, [withdrawals]);

  const handleMine = async (_note: string) => {
    if (!selectedRelayer) {
      alert("Relayer is undefined");
      return;
    }

    if (poofKitLoading) {
      alert("Poof kit is still initializing");
      return;
    }
    // const privateKey =
    //   "7aa6372b29434a32133c757d681774b3b1dddea36f3afbabeddee49b52bb0cd7";
    try {
      const depositEvents = (await getPoofEvents("Deposit", poofKit))[
        Note.getInstance(_note)
      ];
      const withdrawalEvents = (await getPoofEvents("Withdrawal", poofKit))[
        Note.getInstance(_note)
      ];
      const accountEvents = await getMinerEvents("NewAccount", poofKit);
      const depositDataEvents = await getTreeEvents("DepositData", poofKit);
      const withdrawalDataEvents = await getTreeEvents(
        "WithdrawalData",
        poofKit
      );

      const txHash = await poofKit?.reward(
        privateKey ?? "",
        _note,
        selectedRelayer.url,
        depositEvents,
        withdrawalEvents,
        accountEvents,
        depositDataEvents,
        withdrawalDataEvents
      );
      if (txHash) {
        setTxHash(txHash);
        //onMineClick();
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
        if (e.message.includes("already spent")) {
          console.error(e.message);
        } else {
          console.error(
            `${e.message}. This can happen if the trees contract has not been updated since your withdrawal. The contract updates once every few minutes, so try again later.`
          );
        }
      }
    }
  };

  const initMining = async () => {
    setLoading(true);
    // if (withdrawals && withdrawals.length > 0) {
    //   for (let i = 0; i < withdrawals.length; i++) {
    //     await handleMine(withdrawals[i].note.toNoteString());
    //   }
    // }
    const notesArray = toMine.split("\n");
    for (let i = 0; i < notesArray.length; i++) {
      setLeft(notesArray.length - 1);
      const n = notesArray[i];
      console.log(n);
      await handleMine(n);
      // while (loading) {
      //   await new Promise((resolve) => setTimeout(resolve, 1000));
      //   console.log("Hello");
      // }
    }
    setLoading(false);
  };

  let boxContent = (
    <>
      <Text sx={{ mb: 4 }} variant="subtitle">
        {t("mine.desktop.specify.title")}
      </Text>
      <br />
      <Text variant="regularGray">{t("mine.desktop.specify.subtitle")}</Text>
    </>
  );
  if (noteIsValid) {
    boxContent = (
      <>
        <Text sx={{ mb: 4 }} variant="subtitle">
          {t("mine.desktop.review.title")}
        </Text>
        <br />
        <SummaryTable
          title="Summary"
          lineItems={[
            {
              label: "AP",
              value: `${Number(estimatedAp).toLocaleString()} AP`,
            },
            {
              label: `Relayer Fee`,
              value: `-${Number(relayerFee).toLocaleString()} AP`,
            },
          ]}
          totalItem={{
            label: "Total",
            value: `${Number(totalMineAmount).toLocaleString()} AP`,
          }}
        />
      </>
    );
  }

  return (
    <Grid sx={{ gridTemplateColumns: "1.3fr 1fr", gridGap: 6 }}>
      {loading ? (
        <Spinner />
        <Text sx={{ display: "block", mb: 4 }} variant="regularGray">
        Notes Left: {left}
      </Text>

      ) : (
        <Container>
          <Text sx={{ display: "block" }} variant="title">
            {t("mine.desktop.title")}
          </Text>
          <Text sx={{ display: "block", mb: 4 }} variant="regularGray">
            {t("mine.desktop.subtitle")}
          </Text>
          <Textarea
            mb={2}
            disabled={loading}
            name="note"
            placeholder="Enter magic passwords here"
            onChange={(e) => setToMine(e.target.value)}
            value={toMine}
            autoComplete="off"
            rows={25}
          />
          <Button onClick={privateKey ? initMining : getKey}>
            {privateKey ? `Mine!` : `Unlock account`}
          </Button>

          {/* <PickMine
          loading={loading}
          onMineClick={initMining}
          setNote={setNote}
          note={note}
          noteIsValid={noteIsValid}
          estimatedAp={estimatedAp}
          selectedRelayer={selectedRelayer}
          setSelectedRelayer={setSelectedRelayer}
          relayerOptions={relayerOptions}
          usingCustomRelayer={usingCustomRelayer}
          setUsingCustomRelayer={setUsingCustomRelayer}
          customRelayer={customRelayer}
          setCustomRelayer={setCustomRelayer}
          relayerFee={relayerFee}
        /> */}
        </Container>
      )}
      <Container>
        <GrayBox>{boxContent}</GrayBox>
        <Box>
          <NoteList mode={NoteListMode.WITHDRAWS} onFill={setNote} />
        </Box>
      </Container>
    </Grid>
  );
};
