"use client";

import { useEffect, useState } from "react";

import {
  getPortfolioProjects,
  createPortfolioProject,
  updatePortfolioProject,
  deletePortfolioProject,
} from "../api/portfolio";

export function usePortfolio(
  freelancerId: string
) {
  const [projects, setProjects] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  async function refresh() {
    if (!freelancerId) {
      setProjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const result =
      await getPortfolioProjects(
        freelancerId
      );

    if (result.error) {
      console.error(
        "Portfolio loading error:",
        result.error
      );

      setProjects([]);
      setLoading(false);
      return;
    }

    setProjects(result.data ?? []);

    setLoading(false);
  }

  async function create(
    values: Parameters<
      typeof createPortfolioProject
    >[0]
  ) {
    const result =
      await createPortfolioProject(
        values
      );

    if (!result.error) {
      await refresh();
    }

    return result;
  }

  async function update(
    id: string,
    values: Parameters<
      typeof updatePortfolioProject
    >[1]
  ) {
    const result =
      await updatePortfolioProject(
        id,
        values
      );

    if (!result.error) {
      await refresh();
    }

    return result;
  }

  async function remove(id: string) {
    const result =
      await deletePortfolioProject(id);

    if (!result.error) {
      await refresh();
    }

    return result;
  }

  useEffect(() => {
    if (freelancerId) {
      refresh();
    }
  }, [freelancerId]);

  return {
    projects,
    loading,
    refresh,
    create,
    update,
    remove,
  };
}