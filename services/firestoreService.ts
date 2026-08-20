import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { AGENCIES, type Agency } from "../constants/agencies";

// User Services
export const createUserDocument = async (userData: any) => {
  try {
    const userRef = doc(db, "users", userData.uid);
    await setDoc(userRef, {
      ...userData,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error creating user document:", error);
    return { success: false, error };
  }
};

export const getUserDocument = async (uid: string) => {
  try {
    const userRef = doc(db, "users", uid);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      return { success: true, data: userDoc.data() };
    }
    return { success: false, error: "User not found" };
  } catch (error) {
    console.error("Error getting user document:", error);
    return { success: false, error };
  }
};

export const updateUserLastLogin = async (uid: string) => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      lastLogin: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating last login:", error);
    return { success: false, error };
  }
};

// Incident Services
export const createIncidentReport = async (incidentData: any) => {
  try {
    const incidentId = `${incidentData.userId}_${Date.now()}`;
    const incidentRef = doc(db, "incidents", incidentId);

    const completeIncidentData = {
      ...incidentData,
      id: incidentId,
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(incidentRef, completeIncidentData);
    return { success: true, data: completeIncidentData };
  } catch (error) {
    console.error("Error creating incident report:", error);
    return { success: false, error };
  }
};

export const getUserIncidents = async (userId: string) => {
  try {
    const hazardsQuery = query(
      collection(db, "incidents"),
      where("userId", "==", userId),
    );
    const querySnapshot = await getDocs(hazardsQuery);

    const hazards = querySnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a: any, b: any) => {
        const aTime = a.createdAt?.toDate?.()?.getTime() ?? 0;
        const bTime = b.createdAt?.toDate?.()?.getTime() ?? 0;
        return bTime - aTime;
      });

    return { success: true, data: hazards };
  } catch (error) {
    console.error("Error getting user incidents:", error);
    return { success: false, error };
  }
};

// `agency` scopes the read to a single agency's incidents. It isn't optional
// filtering for convenience: under the Firestore rules an agency admin may only
// read its own agency's documents, and an unfiltered query is rejected outright
// rather than trimmed, so callers must pass their agency or be a super admin.
export const getAllIncidents = async (limitCount = 50, agency?: string) => {
  if (agency) {
    return getIncidentsByAgency(agency, limitCount);
  }

  try {
    const hazardsQuery = query(
      collection(db, "incidents"),
      orderBy("createdAt", "desc"),
      limit(limitCount),
    );
    const querySnapshot = await getDocs(hazardsQuery);

    const hazards = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { success: true, data: hazards };
  } catch (error) {
    console.error("Error getting all incidents:", error);
    return { success: false, error };
  }
};

export const getIncidentById = async (incidentId: string) => {
  try {
    const incidentRef = doc(db, "incidents", incidentId);
    const incidentDoc = await getDoc(incidentRef);
    if (incidentDoc.exists()) {
      return {
        success: true,
        data: { id: incidentDoc.id, ...incidentDoc.data() },
      };
    }
    return { success: false, error: "Incident not found" };
  } catch (error) {
    console.error("Error getting incident by id:", error);
    return { success: false, error };
  }
};

// Agencies collection: tracks which agencies currently have at least one
// registered admin, so the report-incident screen can offer a submit button
// only for agencies someone is actually watching.
export const getActiveAgencies = async (): Promise<Agency[]> => {
  try {
    const agenciesQuery = query(
      collection(db, "agencies"),
      where("active", "==", true),
    );
    const querySnapshot = await getDocs(agenciesQuery);
    return querySnapshot.docs
      .map((docSnap) => docSnap.id as Agency)
      .filter((id) => (AGENCIES as readonly string[]).includes(id));
  } catch (error) {
    console.error("Error getting active agencies:", error);
    return [];
  }
};

export const setAgencyActive = async (agency: Agency) => {
  // The `agency: Agency` type only holds at compile time - this value
  // actually comes from a Firestore user doc (an untyped cast), so a bad
  // value (wrong casing, a typo from a manual console edit, ...) can reach
  // here at runtime despite the type. Firestore's rules would reject that
  // write as a generic, confusing "permission denied" anyway, so catch it
  // here with a message that actually says what's wrong.
  if (!(AGENCIES as readonly string[]).includes(agency)) {
    console.warn(
      `setAgencyActive: "${agency}" is not a valid agency (expected one of ${AGENCIES.join(", ")}). Skipping - check this account's users/{uid}.agency field for a typo or casing mismatch.`,
    );
    return;
  }

  try {
    await setDoc(
      doc(db, "agencies", agency),
      { active: true, updatedAt: serverTimestamp() },
      { merge: true },
    );
  } catch (error) {
    console.error("Error marking agency active:", error);
  }
};

export const getIncidentsByAgency = async (agency: string, limitCount = 50) => {
  try {
    const incidentsQuery = query(
      collection(db, "incidents"),
      where("involvedAgency", "==", agency),
    );
    const querySnapshot = await getDocs(incidentsQuery);

    const incidents = querySnapshot.docs
      .map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }))
      .sort((a: any, b: any) => {
        const aTime = a.createdAt?.toDate?.()?.getTime() ?? 0;
        const bTime = b.createdAt?.toDate?.()?.getTime() ?? 0;
        return bTime - aTime;
      })
      .slice(0, limitCount);

    return { success: true, data: incidents };
  } catch (error) {
    console.error("Error getting incidents by agency:", error);
    return { success: false, error };
  }
};

export const getAgencyIncidentCounts = async (agency?: string) => {
  try {
    const allIncidentsResult = await getAllIncidents(1000, agency);
    if (!allIncidentsResult.success) {
      return { success: false, error: allIncidentsResult.error };
    }

    const incidents = allIncidentsResult.data ?? [];
    const counts: Record<string, number> = Object.fromEntries(
      AGENCIES.map((agency) => [agency, 0]),
    );

    incidents.forEach((incident: any) => {
      if (
        incident.involvedAgency &&
        counts[incident.involvedAgency] !== undefined
      ) {
        counts[incident.involvedAgency] += 1;
      }
    });

    return { success: true, data: counts };
  } catch (error) {
    console.error("Error getting agency incident counts:", error);
    return { success: false, error };
  }
};

export const updateIncidentStatus = async (
  incidentId: string,
  status: string,
) => {
  try {
    const incidentRef = doc(db, "incidents", incidentId);
    const incidentSnap = await getDoc(incidentRef);

    await updateDoc(incidentRef, {
      status,
      updatedAt: serverTimestamp(),
    });

    if (incidentSnap.exists()) {
      const incident = incidentSnap.data() as any;
      if (incident.userId) {
        const agency = incident.involvedAgency;
        await addDoc(collection(db, "notifications"), {
          userId: incident.userId,
          incidentId,
          agency: agency ?? null,
          status,
          title: agency ? `${agency} Report Update` : "Report Update",
          message: `Your ${agency ? `${agency} ` : ""}incident report is now ${status.replace("_", " ")}.`,
          read: false,
          createdAt: serverTimestamp(),
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating incident status:", error);
    return { success: false, error };
  }
};

export const addIncidentComment = async (
  incidentId: string,
  comment: string,
) => {
  try {
    const incidentRef = doc(db, "incidents", incidentId);
    const incidentSnap = await getDoc(incidentRef);

    if (!incidentSnap.exists()) {
      return { success: false, error: "Incident not found" };
    }

    const incident = incidentSnap.data() as any;
    if (!incident.userId) {
      return { success: false, error: "Incident has no reporting user" };
    }

    const agency = incident.involvedAgency;
    await addDoc(collection(db, "notifications"), {
      userId: incident.userId,
      incidentId,
      agency: agency ?? null,
      title: agency
        ? `New message from ${agency}`
        : "New message about your report",
      message: comment,
      read: false,
      createdAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error adding incident comment:", error);
    return { success: false, error };
  }
};

// Notification Services
export const getNotificationById = async (notificationId: string) => {
  try {
    const notificationDoc = await getDoc(
      doc(db, "notifications", notificationId),
    );
    if (notificationDoc.exists()) {
      return {
        success: true,
        data: { id: notificationDoc.id, ...notificationDoc.data() },
      };
    }
    return { success: false, error: "Notification not found" };
  } catch (error) {
    console.error("Error getting notification by id:", error);
    return { success: false, error };
  }
};

export const getUserNotifications = async (userId: string) => {
  try {
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
    );
    const querySnapshot = await getDocs(notificationsQuery);

    const notifications = querySnapshot.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .sort((a: any, b: any) => {
        const aTime = a.createdAt?.toDate?.()?.getTime() ?? 0;
        const bTime = b.createdAt?.toDate?.()?.getTime() ?? 0;
        return bTime - aTime;
      });

    return { success: true, data: notifications };
  } catch (error) {
    console.error("Error getting user notifications:", error);
    return { success: false, error };
  }
};

export const markNotificationRead = async (notificationId: string) => {
  try {
    await updateDoc(doc(db, "notifications", notificationId), { read: true });
    return { success: true };
  } catch (error) {
    console.error("Error marking notification read:", error);
    return { success: false, error };
  }
};

export const deleteNotification = async (notificationId: string) => {
  try {
    await deleteDoc(doc(db, "notifications", notificationId));
    return { success: true };
  } catch (error) {
    console.error("Error deleting notification:", error);
    return { success: false, error };
  }
};

export const markAllNotificationsRead = async (userId: string) => {
  try {
    const result = await getUserNotifications(userId);
    if (!result.success || !result.data) {
      return { success: false, error: result.error };
    }
    const unread = (result.data as any[]).filter((n) => !n.read);
    await Promise.all(
      unread.map((n) =>
        updateDoc(doc(db, "notifications", n.id), { read: true }),
      ),
    );
    return { success: true };
  } catch (error) {
    console.error("Error marking all notifications read:", error);
    return { success: false, error };
  }
};

export const deleteIncidentReport = async (incidentId: string) => {
  try {
    const incidentRef = doc(db, "incidents", incidentId);
    await deleteDoc(incidentRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting incident report:", error);
    return { success: false, error };
  }
};

// Admin Services
export const getAllUsers = async () => {
  try {
    const usersQuery = query(
      collection(db, "users"),
      orderBy("createdAt", "desc"),
    );
    const querySnapshot = await getDocs(usersQuery);

    const users = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { success: true, data: users };
  } catch (error) {
    console.error("Error getting all users:", error);
    return { success: false, error };
  }
};

export const updateUserRole = async (uid: string, role: string) => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, { role });
    return { success: true };
  } catch (error) {
    console.error("Error updating user role:", error);
    return { success: false, error };
  }
};

// Statistics Services
export const getIncidentStatistics = async (agency?: string) => {
  try {
    const allIncidentsResult = await getAllIncidents(1000, agency);
    if (!allIncidentsResult.success) {
      return { success: false, error: allIncidentsResult.error };
    }

    const hazards = allIncidentsResult.data ?? [];

    const stats = {
      total: hazards.length,
      pending: hazards.filter((h: any) => h.status === "pending").length,
      inProgress: hazards.filter((h: any) => h.status === "in_progress").length,
      resolved: hazards.filter((h: any) => h.status === "resolved").length,
      thisMonth: hazards.filter((h: any) => {
        const createdAt = h.createdAt.toDate();
        const now = new Date();
        return (
          createdAt.getMonth() === now.getMonth() &&
          createdAt.getFullYear() === now.getFullYear()
        );
      }).length,
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error("Error getting incident statistics:", error);
    return { success: false, error };
  }
};
