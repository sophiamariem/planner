import useFavicon from "./useFavicon";
import { QUICK_TEMPLATES } from "../utils/tripTemplates";
import { extractCoverImage, formatVisibilityLabel } from "../utils/tripMeta";
import { isSupabaseConfigured } from "../lib/supabaseClient";
import useRouteFlags from "./controller/useRouteFlags";
import useToastManager from "./controller/useToastManager";
import usePublishIssues from "./controller/usePublishIssues";
import useOverlayProps from "./controller/useOverlayProps";
import useScreenProps from "./controller/useScreenProps";
import useTripAuthDomain from "./controller/useTripAuthDomain";
import useTripShareDomain from "./controller/useTripShareDomain";
import useTripNavigationDomain from "./controller/useTripNavigationDomain";
import useControllerState from "./controller/useControllerState";
import useCloudDomain from "./controller/useCloudDomain";
import useTripCreationDomain from "./controller/useTripCreationDomain";
import useControllerWiring from "./controller/useControllerWiring";

export default function useTripPlannerController() {
  const routeFlags = useRouteFlags();
  const state = useControllerState();
  const { pushToast } = useToastManager(state.setToasts);

  const creationDomain = useTripCreationDomain({
    ...state,
    pushToast,
  });

  const authDomain = useTripAuthDomain({
    ...state,
    pushToast,
  });

  const cloudDomain = useCloudDomain({
    ...state,
    pushToast,
  });

  useFavicon(state.tripConfig.favicon);

  const shareDomain = useTripShareDomain({
    ...state,
    ...cloudDomain,
    pushToast,
  });

  const navigationDomain = useTripNavigationDomain({
    ...state,
    loadCloudTrip: cloudDomain.loadCloudTrip,
    refreshMyTrips: cloudDomain.refreshMyTrips,
    pushToast,
  });

  const publishIssues = usePublishIssues(state.tripData);

  const { mode, overlayInputs, screenInputs } = useControllerWiring({
    state,
    actions: {
      ...creationDomain,
      ...authDomain,
      ...shareDomain,
      ...navigationDomain,
    },
    config: {
      isSupabaseConfigured,
      quickTemplates: QUICK_TEMPLATES,
      extractCoverImage,
      formatVisibilityLabel,
      publishIssues,
    },
  });

  const overlayProps = useOverlayProps(overlayInputs);
  const {
    authProps,
    onboardingProps,
    builderProps,
    viewProps,
  } = useScreenProps(screenInputs);

  return {
    ...routeFlags,
    mode,
    authProps,
    onboardingProps,
    builderProps,
    viewProps,
    overlayProps,
  };
}
