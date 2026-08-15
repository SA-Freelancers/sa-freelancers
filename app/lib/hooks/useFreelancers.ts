"use client";

import { useEffect, useState } from "react";

import type { UserProfile } from "@/app/dashboard/admin/users/types";

import {
    getFreelancers,
    suspendFreelancer,
    updateFreelancer,
    deleteFreelancer,
} from "../api/freelancers";

export function useFreelancers() {

    const [freelancers, setFreelancers] =
        useState<UserProfile[]>([]);

    const [loading, setLoading] =
        useState(true);

    async function refresh() {

        setLoading(true);

        const { data, error } =
            await getFreelancers();

        if (!error) {
            setFreelancers(
                (data as UserProfile[]) ?? []
            );
        }

        setLoading(false);
    }

    async function suspend(
        id: string,
        suspended: boolean
    ) {

        await suspendFreelancer(
            id,
            suspended
        );

        refresh();

    }

    async function update(
        id: string,
        values: Record<string, unknown>
    ) {

        await updateFreelancer(
            id,
            values
        );

        refresh();

    }

    async function remove(
        id: string
    ) {

        await deleteFreelancer(id);

        refresh();

    }

    useEffect(() => {

        refresh();

    }, []);

    return {

        freelancers,

        loading,

        refresh,

        suspend,

        update,

        remove,

    };

}