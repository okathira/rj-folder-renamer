import * as fs from "fs";
import fetch, { RequestInfo } from "node-fetch";
import { JSDOM } from "jsdom";

const getRJNumber = async (title: string): Promise<string | null> => {
  const baseUrl: RequestInfo = "https://www.google.com/search?q=";
  const searchUrl: RequestInfo =
    baseUrl + encodeURIComponent(title + " DLsite");

  const res = await fetch(searchUrl);
  const html = await res.text();

  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const links = doc.querySelectorAll(
    "#main > div > div > div:nth-child(1) > a"
  );

  for (let i = 0; i < links.length; i++) {
    const contentUrl = links[i].getAttribute("href");

    if (!contentUrl) continue;
    const RJNumbers = contentUrl.match(/RJ[0-9]{6}/);

    if (!RJNumbers) continue;
    return RJNumbers[0];
  }

  return null;
};

const getTargetTitles = (dir: fs.PathLike): string[] => {
  const folderNames: string[] = fs.readdirSync(dir);
  const TargetTitles = folderNames.filter(
    (name) => !name.match(/^RJ[0-9]{6}_/)
  );

  return TargetTitles;
};

interface Corr {
  targetName: string;
  newName: string;
}

const renameFolders = async (dir: fs.PathLike): Promise<void> => {
  const targetTitles = getTargetTitles(dir);
  console.log({ targetTitles });

  const correspondences: Corr[] = await targetTitles.reduce(
    async (list, targetName) => {
      const rj = await getRJNumber(targetName);
      const newName = rj + "_" + targetName;

      fs.renameSync(dir + "/" + targetName, dir + "/" + newName);

      return [...(await list), { targetName, newName }];
    },
    Promise.resolve(Array<Corr>())
  );

  console.log(correspondences);
};

const main = (): void => {
  const arg = process.argv[2];
  if (arg && fs.statSync(arg)) {
    renameFolders(arg);
  } else {
    console.log(
      "usage:",
      process.argv[0],
      process.argv[1],
      "arg_target_directory"
    );
    console.log("'.' to specify current directory");
  }
};

main();
