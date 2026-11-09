import "server-only";

/*
 * Toegang tot de iCloud-spike (spike/icloud) vanuit het beheer. Alleen op de
 * server; de spike slaat niets op en de agenda-koppeling zelf komt pas na een
 * geslaagde spike (docs/besluiten.md, iCloud).
 */
export { runIcloudSpike, type SpikeReport, type SpikeStep } from "../../spike/icloud/checks";
